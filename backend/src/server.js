import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { closeDatabase, connectDatabase, getDatabase } from './db.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
}));

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).toLowerCase(),
  password: z.string().min(10).max(128),
  role: z.enum(['student', 'restaurant', 'rider', 'operations']),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus || 'pending',
  };
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ error: 'Login required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired login' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action' });
    }
    next();
  };
}

function makePickupCode() {
  return `CL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const db = getDatabase();
    const existing = await db.collection('users').findOne({ email: input.email });
    if (existing) return res.status(409).json({ error: 'An account already uses this email' });

    const user = {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      verificationStatus: input.role === 'student' ? 'approved' : 'pending',
      createdAt: new Date(),
    };
    const result = await db.collection('users').insertOne(user);
    user._id = result.insertedId;

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    );
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await getDatabase().collection('users').findOne({ email: input.email });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    );
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getDatabase().collection('users').findOne({ _id: new ObjectId(req.user.sub) });
    if (!user) return res.status(404).json({ error: 'Account not found' });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/batches', requireAuth, async (_req, res, next) => {
  try {
    const batches = await getDatabase().collection('batches')
      .find({ status: { $in: ['accepting', 'confirmed', 'preparing', 'out_for_delivery', 'completed'] } })
      .sort({ orderCutoff: 1 })
      .limit(30)
      .toArray();
    res.json({ batches });
  } catch (error) {
    next(error);
  }
});

app.post('/api/batches', requireAuth, requireRole('operations'), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(3).max(80),
      area: z.string().trim().min(2).max(80),
      orderCutoff: z.coerce.date(),
      deliveryWindow: z.string().trim().min(3).max(40),
      minimumOrders: z.coerce.number().int().min(1).max(1000),
    });
    const input = schema.parse(req.body);
    const batch = {
      ...input,
      paidOrders: 0,
      status: 'accepting',
      restaurants: [],
      createdBy: new ObjectId(req.user.sub),
      createdAt: new Date(),
    };
    const result = await getDatabase().collection('batches').insertOne(batch);
    res.status(201).json({ batch: { ...batch, _id: result.insertedId } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const schema = z.object({
      batchId: z.string(),
      restaurantId: z.string(),
      items: z.array(z.object({
        name: z.string().trim().min(1).max(100),
        quantity: z.number().int().min(1).max(20),
        priceKobo: z.number().int().min(0),
      })).min(1).max(30),
      deliveryPoint: z.string().trim().min(3).max(120),
    });
    const input = schema.parse(req.body);
    const db = getDatabase();
    const batch = await db.collection('batches').findOne({ _id: new ObjectId(input.batchId) });
    if (!batch || batch.status !== 'accepting') {
      return res.status(409).json({ error: 'This delivery batch is no longer accepting orders' });
    }
    if (batch.orderCutoff <= new Date()) {
      return res.status(409).json({ error: 'The order cutoff has passed' });
    }

    const totalKobo = input.items.reduce((sum, item) => sum + item.quantity * item.priceKobo, 0);
    let pickupCode = makePickupCode();
    let order;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      order = {
        batchId: batch._id,
        studentId: new ObjectId(req.user.sub),
        restaurantId: new ObjectId(input.restaurantId),
        items: input.items,
        deliveryPoint: input.deliveryPoint,
        totalKobo,
        pickupCode,
        status: 'New',
        riderId: null,
        createdAt: new Date(),
        paymentStatus: 'demo_not_paid',
      };
      try {
        await db.collection('orders').insertOne(order);
        break;
      } catch (error) {
        if (error.code !== 11000) throw error;
        pickupCode = makePickupCode();
      }
    }

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid request', details: error.issues });
  }
  console.error(error);
  res.status(500).json({ error: 'The request could not be completed' });
});

const port = Number(process.env.PORT || 4000);
await connectDatabase();

const server = app.listen(port, () => {
  console.log(`ChopLocal API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
