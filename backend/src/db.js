import { MongoClient } from 'mongodb';

let client;
let db;

export async function connectDatabase() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'choplocal');
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('orders').createIndex({ pickupCode: 1 }, { unique: true }),
    db.collection('orders').createIndex({ batchId: 1 }),
  ]);
  return db;
}

export function getDatabase() {
  if (!db) throw new Error('Database has not been connected');
  return db;
}

export async function closeDatabase() {
  if (client) await client.close();
  db = undefined;
  client = undefined;
}
