import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const dishes = [
  { id: 'amala', name: 'Amala, Gbegiri & Ewedu', desc: 'The classic trio, made fresh and served hot.', price: 4200, emoji: '🍲', tag: 'Signature', color: '#e9dfc8' },
  { id: 'pounded', name: 'Pounded Yam & Egusi', desc: 'Rich melon seed soup with your choice of protein.', price: 4800, emoji: '🥣', tag: 'Customer favourite', color: '#f0dfc7' },
  { id: 'jollof', name: 'Smoky Party Jollof', desc: 'A generous portion with plantain on the side.', price: 3500, emoji: '🍛', tag: 'Popular', color: '#f2dfc3' },
  { id: 'ewa', name: 'Ewa Agoyin & Plantain', desc: 'Soft beans, pepper sauce and ripe fried plantain.', price: 3200, emoji: '🍌', tag: 'Comfort food', color: '#e8e2c5' },
  { id: 'fufu', name: 'Fufu & Okra Soup', desc: 'A hearty, satisfying bowl of Nigerian comfort.', price: 4500, emoji: '🥘', tag: 'Made fresh', color: '#dfebd6' },
  { id: 'friedrice', name: 'Fried Rice & Chicken', desc: 'Colourful fried rice with a well-seasoned chicken piece.', price: 3900, emoji: '🍗', tag: 'Popular', color: '#f4dfd0' },
  { id: 'ofada', name: 'Ofada Rice & Ayamase', desc: 'Local rice with bold, green pepper sauce.', price: 5000, emoji: '🍚', tag: 'Local pick', color: '#e7e6d3' },
  { id: 'beans', name: 'Beans & Dodo', desc: 'Slow-cooked beans with sweet fried plantain.', price: 3000, emoji: '🫘', tag: 'Hearty', color: '#eadbc8' },
];

const sampleOrders = [
  { id: 'CL-1042', restaurant: 'Sweet Sensation', items: ['1 × Party jollof rice', '1 × Chicken and chips'], total: 10400, area: 'Festac Town', status: 'Preparing', rider: 'Royal Rider Ada' },
  { id: 'CL-1041', restaurant: 'Chicken Republic', items: ['2 × Rice and chicken'], total: 9800, area: 'Amuwo Odofin', status: 'Ready for pickup', rider: 'Unassigned' },
  { id: 'CL-1040-A', restaurant: 'Cold Stone Creamery', items: ['1 × Signature ice cream'], total: 6500, area: 'Festac Town', status: 'Picked up', rider: 'Royal Rider Timi' },
  { id: 'CL-1040-B', restaurant: 'Festac Pizza Kitchen', items: ['1 × Chicken pizza'], total: 7800, area: 'Festac Town', status: 'Preparing', rider: 'Royal Rider Timi' },
  { id: 'CL-1039', restaurant: 'Amala Ibadan', items: ['1 × Amala, Gbegiri and Ewedu'], total: 4200, area: 'Festac Town', status: 'Delivered', rider: 'Royal Rider Femi' },
];

const statuses = ['New', 'Accepted', 'Preparing', 'Ready for pickup', 'Picked up', 'Delivered', 'Cancelled'];
const riders = ['Unassigned', 'Royal Rider Ada', 'Royal Rider Femi', 'Royal Rider Timi'];
const money = (value) => `₦${Number(value).toLocaleString('en-NG')}`;

function readOrders() {
  try {
    const raw = localStorage.getItem('choplocal.demo.orders');
    if (!raw) return sampleOrders;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Invalid orders data');
    return parsed;
  } catch {
    return sampleOrders;
  }
}

function Header({ count, page, setPage, onOpenBasket }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => setPage('menu')}>
        ✳ chop<span>local</span>
      </button>
      <nav>
        <button type="button" className={page === 'menu' ? 'nav-active' : ''} onClick={() => setPage('menu')}>Menu</button>
        <button type="button" className={page === 'batches' ? 'nav-active' : ''} onClick={() => setPage('batches')}>Delivery windows</button>
        <button type="button" className={page === 'admin' ? 'nav-active' : ''} onClick={() => setPage('admin')}>Order desk</button>
      </nav>
      {page === 'menu' && (
        <button type="button" className="basket-button" onClick={onOpenBasket}>Basket <span>{count}</span></button>
      )}
    </header>
  );
}

function MenuPage({ cart, setCart, openBasket }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('popular');

  const visibleDishes = useMemo(() => {
    const next = dishes.filter((dish) => `${dish.name} ${dish.desc} ${dish.tag}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'price-low') return [...next].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') return [...next].sort((a, b) => b.price - a.price);
    if (sort === 'name') return [...next].sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [query, sort]);

  const addToCart = (dishId) => {
    setCart((current) => ({ ...current, [dishId]: (current[dishId] || 0) + 1 }));
  };

  const total = dishes.reduce((sum, dish) => sum + (dish.price * (cart[dish.id] || 0)), 0);

  return (
    <>
      <div className="announcement">A neighbourhood food pilot for <strong>Festac, Lagos</strong> · sample menu only</div>
      <main className="app-shell">
        <section className="hero">
          <div>
            <p className="eyebrow">Good food. Close to home.</p>
            <h1>Festac, what<br />are we <em>eating?</em></h1>
            <p className="hero-copy">Tell us what you’re craving and your food budget. Discover local restaurants with the dishes you want—all in one place.</p>
            <label className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search amala, jollof, suya..." aria-label="Search dishes" />
            </label>
            <div className="proof">
              <span>🍲 &nbsp;🍛 &nbsp;🥘</span>
              <span><strong>Made for Festac.</strong> Start with Amala Ibadan.</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Illustration of a Nigerian meal">
            <div className="sun" />
            <div className="plate">🍲</div>
            <div className="float-card">🛵 <strong>Local riders</strong><small>Careful, door-to-door delivery</small></div>
          </div>
        </section>

        <section>
          <div className="section-heading">
            <h2>Find your next favourite</h2>
            <label className="sort-label">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="popular">Popular</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>

          <div className="food-grid">
            {visibleDishes.length > 0 ? visibleDishes.map((dish) => (
              <article className="food-card" key={dish.id}>
                <div className="dish-picture" style={{ background: dish.color }}>
                  <span className="dish-tag">{dish.tag}</span>
                  <span className="dish-emoji">{dish.emoji}</span>
                </div>
                <div className="dish-info">
                  <h3>{dish.name}</h3>
                  <p>{dish.desc}</p>
                  <div className="dish-bottom">
                    <strong>{money(dish.price)}</strong>
                    <button type="button" className="add-button" onClick={() => addToCart(dish.id)} aria-label={`Add ${dish.name} to basket`}>+</button>
                  </div>
                </div>
              </article>
            )) : <div className="empty-state">No dishes found. Try another search.</div>}
          </div>
        </section>

        <p className="demo-note">Concept preview only. Menus and prices need restaurant approval. Checkout creates a local demo order; no payment or real delivery is connected.</p>
      </main>

      {Object.values(cart).some(Boolean) && (
        <button type="button" className="basket-button" style={{ position: 'fixed', bottom: '12px', left: '14px', right: '14px', zIndex: 10, display: 'block' }} onClick={openBasket}>
          View basket · {money(total)}
        </button>
      )}
    </>
  );
}

function Basket({ cart, setCart, onClose, onCheckout }) {
  const items = dishes.filter((dish) => cart[dish.id]);
  const total = items.reduce((sum, dish) => sum + dish.price * cart[dish.id], 0);

  return (
    <div className="overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="basket-panel" aria-label="Your basket">
        <div className="panel-title">
          <h2>Your basket</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close basket">×</button>
        </div>

        {items.length ? items.map((dish) => (
          <div className="basket-line" key={dish.id}>
            <div>
              <strong>{dish.name}</strong>
              <small>{money(dish.price)} each</small>
            </div>
            <div className="quantity">
              <button type="button" onClick={() => setCart((current) => {
                const next = { ...current };
                if ((next[dish.id] || 0) <= 1) delete next[dish.id]; else next[dish.id] = next[dish.id] - 1;
                return next;
              })}>−</button>
              <b>{cart[dish.id]}</b>
              <button type="button" onClick={() => setCart((current) => ({ ...current, [dish.id]: (current[dish.id] || 0) + 1 }))}>+</button>
            </div>
          </div>
        )) : <p className="empty-state">Your basket is waiting for something delicious.</p>}

        <div className="basket-total"><span>Food subtotal</span><strong>{money(total)}</strong></div>
        <button type="button" className="primary-button full-width" disabled={!items.length} onClick={onCheckout}>Continue to checkout</button>
        <p className="fine-print">Delivery cost depends on distance and restaurant pickup stops; it is not estimated in this demo.</p>
      </aside>
    </div>
  );
}

function Checkout({ cart, setPage, setCart }) {
  const [area, setArea] = useState('Festac Town');
  const [deliveryPoint, setDeliveryPoint] = useState('Festac Town gate');
  const [window, setWindow] = useState('7:00 PM – 7:30 PM');
  const [firstName, setFirstName] = useState('');
  const [notice, setNotice] = useState('');
  const items = dishes.filter((dish) => cart[dish.id]);
  const total = items.reduce((sum, dish) => sum + dish.price * cart[dish.id], 0);

  function placeOrder(event) {
    event.preventDefault();
    if (!area.trim() || !items.length) return;

    try {
      const current = readOrders();
      const id = `CL-DEMO-${Date.now().toString().slice(-6)}`;
      const order = {
        id,
        restaurant: 'Amala Ibadan',
        items: items.map((dish) => `${cart[dish.id]} × ${dish.name}`),
        total,
        area: area.trim(),
        deliveryPoint: deliveryPoint.trim(),
        deliveryWindow: window,
        pickupCode: `CL-${Date.now().toString().slice(-6)}`,
        customerFirstName: firstName.trim(),
        paymentStatus: 'Demo - no payment',
        status: 'New',
        rider: 'Unassigned',
      };
      localStorage.setItem('choplocal.demo.orders', JSON.stringify([...current, order]));
      setCart({});
      setNotice(`Demo order ${id} created. It was not sent to a restaurant or rider.`);
    } catch (error) {
      setNotice(`Could not save the demo order: ${error.message}`);
    }
  }

  return (
    <main className="app-shell portal-page">
      <p className="eyebrow">Festac pilot · checkout</p>
      <h1 className="portal-title">Review your food plan</h1>

      <div className="demo-banner"><strong>Prototype checkout only.</strong> This page does not take payment or send a real order. Don’t enter personal or payment details.</div>

      {notice ? (
        <section className="panel success-panel">
          <div className="success-icon">✓</div>
          <h2>Demo order created</h2>
          <p>{notice}</p>
          <button type="button" className="primary-button" onClick={() => setPage('admin')}>View order desk</button>
          <button type="button" className="secondary-button" onClick={() => setPage('menu')}>Back to menu</button>
        </section>
      ) : (
        <div className="checkout-layout">
          <section className="panel">
            <h2>Your items</h2>
            {items.length ? items.map((dish) => (
              <div className="checkout-line" key={dish.id}>
                <span>{cart[dish.id]} × {dish.name}<small>{money(dish.price)} each</small></span>
                <strong>{money(dish.price * cart[dish.id])}</strong>
              </div>
            )) : <p className="empty-state">Your basket is empty. <button type="button" className="text-button" onClick={() => setPage('menu')}>Return to the menu</button>.</p>}
          </section>

          <section className="panel">
            <h2>Delivery preview</h2>
            <div className="summary-row"><span>Food subtotal</span><strong>{money(total)}</strong></div>
            <p className="fine-print">Delivery cost is not estimated in this demo.</p>
            <form className="form-stack" onSubmit={placeOrder}>
              <label>Delivery area for this demo
                <input value={area} onChange={(e) => setArea(e.target.value)} required />
              </label>
              <label>Pickup or drop-off point
                <input value={deliveryPoint} onChange={(e) => setDeliveryPoint(e.target.value)} required />
              </label>
              <label>Your first name
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={40} />
              </label>
              <label>Delivery window
                <select value={window} onChange={(e) => setWindow(e.target.value)}>
                  <option>7:00 PM – 7:30 PM</option>
                  <option>7:30 PM – 8:00 PM</option>
                  <option>8:00 PM – 8:30 PM</option>
                </select>
              </label>
              <button type="submit" className="primary-button" disabled={!items.length}>Create demo order</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function DeliveryWindowsPage() {
  const windows = [
    { id: 'FW-01', time: '7:00 PM – 7:30 PM', cutoff: 'Order by 4:30 PM', area: 'Festac Town', paid: 18, minimum: 30 },
    { id: 'FW-02', time: '7:30 PM – 8:00 PM', cutoff: 'Order by 5:00 PM', area: 'Amuwo Odofin', paid: 11, minimum: 20 },
    { id: 'FW-03', time: '8:00 PM – 8:30 PM', cutoff: 'Order by 5:30 PM', area: 'Mile 2', paid: 7, minimum: 20 },
  ];

  return (
    <main className="app-shell portal-page">
      <p className="eyebrow">Scheduled campus and neighbourhood delivery</p>
      <h1 className="portal-title">Choose a delivery window</h1>
      <div className="window-grid">
        {windows.map((window) => {
          const progress = Math.min(100, Math.round(window.paid / window.minimum * 100));
          return (
            <article className="panel window-card" key={window.id}>
              <div className="window-top">
                <strong>{window.area}</strong>
                <span className="status-pill">{window.id}</span>
              </div>
              <h2>{window.time}</h2>
              <p className="fine-print">{window.cutoff}</p>
              <div className="progress-track" aria-label={`${progress}% of minimum paid orders`}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="batch-progress"><strong>{window.paid} paid orders</strong> · {window.minimum} minimum</p>
              <button type="button" className="primary-button full-width" disabled={window.paid >= window.minimum}>Join window</button>
            </article>
          );
        })}
      </div>
      <div className="demo-banner">A window closes when it reaches its cut-off or minimum. No restaurant starts unpaid cooking in the demo.</div>
    </main>
  );
}

function Admin({ setPage }) {
  const [orders, setOrders] = useState(() => readOrders());
  const [role, setRole] = useState('restaurant');
  const [restaurant, setRestaurant] = useState('');
  const [notice, setNotice] = useState('');

  const restaurants = useMemo(() => [...new Set(orders.map((order) => order.restaurant))].sort(), [orders]);
  const selectedRestaurant = restaurant || restaurants[0] || '';
  const visibleOrders = orders.filter((order) =>
    role === 'operations'
    || (role === 'restaurant' && order.restaurant === selectedRestaurant)
    || (role === 'rider' && (order.rider !== 'Unassigned'))
  );

  function updateOrder(id, field, value) {
    const next = orders.map((order) => order.id === id ? { ...order, [field]: value } : order);
    localStorage.setItem('choplocal.demo.orders', JSON.stringify(next));
    setOrders(next);
    setNotice('Demo order updated in this browser only.');
  }

  return (
    <main className="app-shell portal-page">
      <p className="eyebrow">Festac pilot · operations</p>
      <h1 className="portal-title">Order desk</h1>

      <div className="demo-banner"><strong>Prototype only—not secure or connected to a server.</strong> The role switch below only demonstrates what each role would see. It is not authentication or a real permission boundary.</div>

      <section className="panel toolbar">
        <label>
          Demo view
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="restaurant">Restaurant staff</option>
            <option value="operations">ChopLocal operations</option>
            <option value="rider">Rider</option>
          </select>
        </label>

        <label>
          Restaurant
          <select value={selectedRestaurant} disabled={role === 'operations'} onChange={(e) => setRestaurant(e.target.value)}>
            {restaurants.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>

        <p className="fine-print">{role === 'operations' ? 'Operations can view every restaurant order and manage rider assignment.' : 'Restaurant staff can view and update orders for their restaurant only.'}</p>
      </section>

      {role === 'rider' && (
        <section className="panel verification-panel">
          <div>
            <p className="eyebrow">Rider account</p>
            <h2>Demo verification and vehicle</h2>
          </div>
          <div className="verification-grid">
            <label>Vehicle type
              <select defaultValue="motorcycle">
                <option value="bicycle">Bicycle</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="tricycle">Tricycle</option>
                <option value="car">Small car</option>
                <option value="van">Van</option>
              </select>
            </label>
            <label>Vehicle registration
              <input placeholder="Demo registration number" />
            </label>
            <button type="button" className="primary-button" onClick={() => setNotice('Verification documents are not collected in this demo.')}>Open secure verification</button>
          </div>
          <p className="fine-print">Do not upload NIN, BVN, licence, or face data here. Production verification should go through an approved provider and store only status.</p>
        </section>
      )}

      <p className="notice" role="status">{notice}</p>

      <section className="order-list">
        {visibleOrders.length ? visibleOrders.map((order) => (
          <article className="panel order-card" key={order.id}>
            <div className="order-top">
              <div>
                <strong>{order.id}</strong>
                <p className="fine-print">{order.restaurant} · delivery area: {order.area}</p>
              </div>
              <span className="status-pill">{order.status}</span>
            </div>
            <div className="order-items">
              {order.items.map((item, index) => <div key={`${order.id}-${index}`}>{item}</div>)}
              <strong>Food subtotal: {money(order.total)}</strong>
            </div>
            <div className="order-controls">
              <label>
                Update status
                <select value={order.status} onChange={(e) => updateOrder(order.id, 'status', e.target.value)}>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>

              {role === 'operations' && (
                <label>
                  Rider
                  <select value={order.rider} onChange={(e) => updateOrder(order.id, 'rider', e.target.value)}>
                    {riders.map((rider) => <option key={rider} value={rider}>{rider}</option>)}
                  </select>
                </label>
              )}
              {role === 'rider' && (
                <div className="delivery-actions">
                  <span className="pickup-code">Pickup: {order.pickupCode || 'CL-DEMO'}</span>
                  <button type="button" className="secondary-button" onClick={() => updateOrder(order.id, 'status', 'Picked up')}>Scan / mark collected</button>
                  <button type="button" className="primary-button" onClick={() => updateOrder(order.id, 'status', 'Delivered')}>Confirm delivery</button>
                </div>
              )}
            </div>
          </article>
        )) : <div className="empty-state">No orders are visible in this view.</div>}
      </section>
    </main>
  );
}

function App() {
  const [page, setPage] = useState('menu');
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('choplocal.demo.cart') || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  });
  const [basketOpen, setBasketOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('choplocal.demo.cart', JSON.stringify(cart));
  }, [cart]);

  const basketCount = Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);

  return (
    <>
      <div className="app-shell">
        <Header count={basketCount} page={page} setPage={setPage} onOpenBasket={() => setBasketOpen(true)} />
        {page === 'menu' && <MenuPage cart={cart} setCart={setCart} openBasket={() => setBasketOpen(true)} />}
        {page === 'batches' && <DeliveryWindowsPage />}
        {page === 'checkout' && <Checkout cart={cart} setCart={setCart} setPage={setPage} />}
        {page === 'admin' && <Admin setPage={setPage} />}
        <footer className="site-footer"><span>✳ chop<span>local</span></span><span>Made with love for Festac, Lagos · Prototype demo</span></footer>
      </div>
      {basketOpen && page === 'menu' && (
        <Basket cart={cart} setCart={setCart} onClose={() => setBasketOpen(false)} onCheckout={() => { setPage('checkout'); setBasketOpen(false); }} />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
