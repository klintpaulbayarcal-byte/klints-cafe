'use client'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: number; name: string; category: string
  description: string; price: number; stock_quantity: number
  image_url: string; is_available: boolean; is_featured: boolean
}
interface CartItem extends Product { quantity: number }

const FALLBACK: Product[] = [
  { id:1, name:'Americano',         category:'coffee',     description:'Espresso topped with hot water.',                price:140, stock_quantity:20, image_url:'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&fit=crop', is_available:true, is_featured:true },
  { id:2, name:'Cappuccino',        category:'coffee',     description:'Espresso with steamed milk and foam.',           price:165, stock_quantity:17, image_url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&fit=crop', is_available:true, is_featured:true },
  { id:3, name:'Caramel Macchiato', category:'coffee',     description:'Espresso with steamed milk and sweet caramel drizzle.', price:180, stock_quantity:12, image_url:'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&fit=crop', is_available:true, is_featured:true },
  { id:4, name:'Espresso',          category:'coffee',     description:'Strong and bold single-shot espresso.',          price:120, stock_quantity:15, image_url:'https://images.unsplash.com/photo-1596952954288-16862d37405b?w=800&fit=crop', is_available:true, is_featured:false },
  { id:5, name:'Latte',             category:'coffee',     description:'Creamy milk coffee with smooth texture.',        price:160, stock_quantity:17, image_url:'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&fit=crop', is_available:true, is_featured:false },
  { id:6, name:'Ham and Cheese Sandwich', category:'food', description:'Toasted sandwich with ham and cheese.',          price:180, stock_quantity:16, image_url:'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&fit=crop', is_available:true, is_featured:false },
  { id:7, name:'Iced Tea Lemon',    category:'non-coffee', description:'Refreshing brewed tea with lemon.',              price:110, stock_quantity:18, image_url:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&fit=crop', is_available:true, is_featured:false },
  { id:8, name:'Chocolate Muffin',  category:'pastry',     description:'Freshly baked chocolate muffin.',                price:85,  stock_quantity:13, image_url:'https://images.unsplash.com/photo-1604882406195-d94d4f33b0a9?w=800&fit=crop', is_available:true, is_featured:false },
]

function php(n: number) {
  return new Intl.NumberFormat('en-PH', { style:'currency', currency:'PHP' }).format(n)
}

function StockBadge({ qty }: { qty: number }) {
  if (qty <= 0) return <span className="badge badge-stock-out">Out of Stock</span>
  if (qty <= 5) return <span className="badge badge-stock-low">Stock: {qty}</span>
  return <span className="badge badge-stock-ok">Stock: {qty}</span>
}

export default function CafePage() {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  const [products,  setProducts]  = useState<Product[]>(FALLBACK)
  const [cart,      setCart]      = useState<CartItem[]>([])
  const [category,  setCategory]  = useState('all')
  const [search,    setSearch]    = useState('')
  const [orderType, setOrderType] = useState('Pickup')
  const [payment,   setPayment]   = useState('Cash on Delivery')
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [notes,     setNotes]     = useState('')
  const [address,   setAddress]   = useState('')
  const [status,    setStatus]    = useState<'idle'|'placing'|'ok'|'err'>('idle')
  const [msg,       setMsg]       = useState('')
  const [heroLoaded,setHeroLoaded]= useState(false)

  /* Load products */
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { if (d.success && d.products?.length) setProducts(d.products) })
      .catch(() => {})
  }, [])

  /* Hero image pre-load */
  useEffect(() => {
    const img = new Image()
    img.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&fit=crop'
    img.onload = () => setHeroLoaded(true)
  }, [])

  /* Parallax */
  useEffect(() => {
    const hero = document.getElementById('hero-bg')
    const onScroll = () => {
      if (hero) hero.style.transform = `scale(1.08) translateY(${window.scrollY * 0.25}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const categories = useMemo(() =>
    ['all', ...Array.from(new Set(products.map(p => p.category)))],
    [products]
  )

  const visible = useMemo(() =>
    products.filter(p => {
      if (!p.is_available) return false
      if (category !== 'all' && p.category !== category) return false
      const q = search.toLowerCase()
      return !q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)
    }),
    [products, category, search]
  )

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
  const subtotal   = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax        = subtotal * 0.10
  const delivFee   = orderType === 'Delivery' ? 50 : 0
  const svcFee     = 10
  const total      = subtotal + tax + delivFee + svcFee
  const totalStock = products.reduce((s, p) => s + p.stock_quantity, 0)
  const lowStockN  = products.filter(p => p.stock_quantity <= 5 && p.is_available).length

  const addToCart = useCallback((p: Product) => {
    setCart(c => {
      const ex = c.find(i => i.id === p.id)
      return ex
        ? c.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...c, { ...p, quantity: 1 }]
    })
  }, [])

  const changeQty = useCallback((id: number, d: number) => {
    setCart(c => c.map(i => i.id === id ? { ...i, quantity: i.quantity + d } : i).filter(i => i.quantity > 0))
  }, [])

  async function placeOrder() {
    if (!name.trim()) { setStatus('err'); setMsg('Please enter your name'); return }
    if (cart.length === 0) { setStatus('err'); setMsg('Your cart is empty'); return }
    if (orderType === 'Delivery' && !address.trim()) { setStatus('err'); setMsg('Please enter delivery address'); return }

    setStatus('placing'); setMsg('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name, customer_phone: phone,
          order_type: orderType.toLowerCase(),
          payment_method: payment.toLowerCase().replace(/\s+/g, '_'),
          notes, delivery_address: address,
          items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setCart([]); setStatus('ok')
      setMsg(`✓ Order placed! Your order code is ${d.order_code}`)
    } catch (e: unknown) {
      setStatus('err')
      setMsg(e instanceof Error ? e.message : 'Failed to place order')
    }
  }

  return (
    <>
      {/* ── HEADER ── */}
      <header className="cafe-header">
        <div className="cafe-header-inner">
          <a className="cafe-logo" href="/">Klint&apos;s <em>Cafe</em></a>
          <nav className="header-nav">
            <button className="header-btn" onClick={() => router.push('/track')}>Track Order</button>
            <button className="header-btn primary" onClick={() => router.push('/login')}>Staff Login</button>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero" style={{ opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.8s' }}>
        <div className="hero-bg" id="hero-bg" />
        <div className="hero-float-img">
          <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&fit=crop" alt="Coffee" />
        </div>
        <div className="hero-content">
          <span className="hero-kicker">Premium · Artisan · Fresh</span>
          <h1 className="hero-title">Klint&apos;s <em>Cafe</em></h1>
          <p className="hero-subtitle">Premium coffee and light meals crafted with care.<br />Order fresh, enjoy every moment.</p>
          <div className="hero-info-row">
            <div className="hero-info">
              <div><span className="hero-info-label">Open Today</span><span className="hero-info-val">8:00 AM – 10:00 PM</span></div>
            </div>
            <div className="hero-info">
              <div><span className="hero-info-label">Pickup ETA</span><span className="hero-info-val">15–25 minutes</span></div>
            </div>
            <div className="hero-info">
              <div><span className="hero-info-label">Location</span><span className="hero-info-val">Cabadug, Loon, Bohol</span></div>
            </div>
          </div>
          <div className="hero-actions">
            <button className="hero-cta primary" onClick={() => menuRef.current?.scrollIntoView({ behavior:'smooth' })}>Order Now</button>
            <button className="hero-cta outline" onClick={() => router.push('/track')}>Track Order</button>
            <button className="hero-cta outline" onClick={() => {}}>Visit Us</button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num">{products.length}</div><div className="stat-lbl">Menu Items</div></div>
          <div className="stat-item"><div className="stat-num">{categories.length - 1}</div><div className="stat-lbl">Categories</div></div>
          <div className="stat-item"><div className="stat-num">{totalStock}</div><div className="stat-lbl">Items in Stock</div></div>
          <div className="stat-item"><div className="stat-num">{lowStockN}</div><div className="stat-lbl">Low Stock Alerts</div></div>
        </div>
      </div>

      {/* ── MENU + SIDEBAR ── */}
      <div className="menu-section" ref={menuRef} id="menu">
        {/* LEFT: Products */}
        <div>
          <div className="menu-header">
            <h2 className="menu-title">Our Menu</h2>
            <p className="menu-subtitle">Handpicked selection of quality beverages and delicious treats</p>
            <div className="filter-bar">
              {categories.map(c => (
                <button key={c} className={`filter-chip${category === c ? ' active' : ''}`}
                  onClick={() => setCategory(c)}>{c === 'all' ? 'All' : c.replace(/-/g,' ').replace(/\b\w/g, x => x.toUpperCase())}</button>
              ))}
              <input className="menu-search" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="product-grid">
            {visible.length === 0
              ? <p className="empty-state">No items found.</p>
              : visible.map((p, idx) => (
                <article key={p.id} className="product-card" style={{ animationDelay: `${idx * 0.06}s` }}>
                  <div className="product-img-wrap">
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&fit=crop'} alt={p.name} loading="lazy" />
                    <div className="badge-row">
                      {p.is_featured && <span className="badge badge-seller">Best Seller</span>}
                      <span className="badge badge-cat">{p.category.toUpperCase()}</span>
                      <StockBadge qty={p.stock_quantity} />
                    </div>
                  </div>
                  <div className="product-body">
                    <div className="product-name">{p.name}</div>
                    <div className="product-desc">{p.description}</div>
                    <div className="product-footer">
                      <span className="product-price">{php(p.price)}</span>
                      <button className="add-btn" disabled={p.stock_quantity <= 0} onClick={() => addToCart(p)}>
                        {p.stock_quantity <= 0 ? 'Sold Out' : 'Add'}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            }
          </div>
        </div>

        {/* RIGHT: Order Panel */}
        <aside className="order-sidebar">
          <h2 className="sidebar-title">Your Order</h2>

          <label className="form-lbl">Your Name *</label>
          <input className="form-inp" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />

          <label className="form-lbl">Phone</label>
          <input className="form-inp" placeholder="09xx xxx xxxx" value={phone} onChange={e => setPhone(e.target.value)} />

          <label className="form-lbl">Order Type</label>
          <select className="form-sel" value={orderType} onChange={e => setOrderType(e.target.value)}>
            <option>Pickup</option>
            <option>Delivery</option>
          </select>

          {orderType === 'Delivery' && (
            <>
              <label className="form-lbl">Delivery Address *</label>
              <input className="form-inp" placeholder="House no., street, barangay" value={address} onChange={e => setAddress(e.target.value)} />
            </>
          )}

          <label className="form-lbl">Payment Method</label>
          <select className="form-sel" value={payment} onChange={e => setPayment(e.target.value)}>
            <option>Cash on Delivery</option>
            <option>GCash</option>
            <option>Cash</option>
          </select>

          <label className="form-lbl">Special Notes</label>
          <textarea className="form-ta" placeholder="Any special requests?" value={notes} onChange={e => setNotes(e.target.value)} />

          <div className="divider" />

          {/* Cart Items */}
          {cart.length === 0
            ? <p className="cart-empty">Cart is empty</p>
            : cart.map(item => (
              <div key={item.id} className="cart-item">
                <div>
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{php(item.price)} × {item.quantity} = {php(item.price * item.quantity)}</div>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(item.id, +1)}>+</button>
                </div>
              </div>
            ))
          }

          {/* Summary */}
          <div className="cart-summary">
            <div className="summary-row"><span>Subtotal</span><span>{php(subtotal)}</span></div>
            <div className="summary-row"><span>Tax (10%)</span><span>{php(tax)}</span></div>
            <div className="summary-row"><span>Delivery Fee</span><span>{php(delivFee)}</span></div>
            <div className="summary-row"><span>Service Fee</span><span>{php(svcFee)}</span></div>
            <div className="summary-total"><span>Total</span><span>{php(total)}</span></div>

            <button className="place-btn" onClick={placeOrder} disabled={status === 'placing'}>
              {status === 'placing' ? 'Placing Order…' : 'Place Order'}
            </button>
            {cart.length > 0 && <button className="clear-btn" onClick={() => setCart([])}>Clear Cart</button>}

            {status === 'ok'  && <div className="alert-success">{msg}</div>}
            {status === 'err' && <div className="alert-error">{msg}</div>}
          </div>
        </aside>
      </div>
    </>
  )
}
