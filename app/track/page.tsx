'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TimelineStep { status: string; completed: boolean; active: boolean }
interface OrderItem { name: string; quantity: number; price: number }
interface Order {
  id: number; customer_name: string; customer_phone: string
  order_type: string; payment_method: string; status: string
  subtotal: number; tax: number; delivery_fee: number; service_fee: number; total: number
  notes: string; created_at: string; order_items: OrderItem[]
}

function php(n: number) {
  return new Intl.NumberFormat('en-PH', { style:'currency', currency:'PHP' }).format(n)
}

const STATUS_COLORS: Record<string, string> = {
  Received: '#60a5fa', Processing: '#fbbf24', 'Out for Delivery': '#2dd4bf',
  Ready: '#c084fc', Completed: '#4ade80', Cancelled: '#f87171',
}

export default function TrackPage() {
  const router = useRouter()
  const [orderId,   setOrderId]   = useState('')
  const [identity,  setIdentity]  = useState('')
  const [status,    setStatus]    = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msg,       setMsg]       = useState('')
  const [order,     setOrder]     = useState<Order | null>(null)
  const [timeline,  setTimeline]  = useState<TimelineStep[]>([])

  async function track() {
    if (!orderId.trim() || !identity.trim()) {
      setStatus('err'); setMsg('Please enter order ID and your name or phone'); return
    }
    setStatus('loading'); setMsg('Looking up your order…')
    try {
      const q = new URLSearchParams({ order_id: orderId.trim(), identity: identity.trim() })
      const res = await fetch(`/api/track?${q}`)
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setOrder(d.order); setTimeline(d.timeline); setStatus('ok'); setMsg('')
    } catch (e: unknown) {
      setOrder(null); setTimeline([])
      setStatus('err'); setMsg(e instanceof Error ? e.message : 'Order not found')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--navy)', position:'relative', overflow:'hidden' }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&fit=crop')", backgroundSize:'cover', backgroundPosition:'center', opacity:0.06 }} />

      {/* Header */}
      <header className="cafe-header">
        <div className="cafe-header-inner">
          <a className="cafe-logo" href="/">Klint&apos;s <em>Cafe</em></a>
          <button className="header-btn" onClick={() => router.push('/')}>← Back to Menu</button>
        </div>
      </header>

      <div className="track-page">
        <div className="track-card">
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <h1 className="track-title">Track Your Order</h1>
            <p className="track-sub">Enter your order number and the same name or phone you used at checkout.</p>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <input
              className="form-inp" style={{ flex:'1', minWidth:'140px' }}
              placeholder="Order ID (e.g. 24)" value={orderId}
              onChange={e => setOrderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && track()}
            />
            <input
              className="form-inp" style={{ flex:'2', minWidth:'180px' }}
              placeholder="Customer name or phone" value={identity}
              onChange={e => setIdentity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && track()}
            />
            <button
              className="place-btn" style={{ width:'auto', padding:'0 1.8rem', marginBottom:0 }}
              onClick={track} disabled={status === 'loading'}>
              {status === 'loading' ? '…' : 'Track'}
            </button>
          </div>

          {status === 'err' && <div className="alert-error" style={{ marginTop:'1rem' }}>{msg}</div>}

          {/* Result */}
          {order && (
            <div className="track-result">
              {/* Status header */}
              <div className="track-status-header">
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Order #{order.id}</div>
                  <div style={{ fontSize:'1rem', color:'var(--cream)', marginTop:'0.25rem' }}>{order.customer_name}</div>
                </div>
                <span className="status-badge-lg" style={{ background:`${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] }}>
                  {order.status}
                </span>
                <div style={{ marginLeft:'auto', textAlign:'right' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{order.order_type.toUpperCase()} · {order.payment_method.toUpperCase()}</div>
                  <div style={{ color:'var(--gold)', fontWeight:600 }}>{php(order.total)}</div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'1rem' }}>Order Progress</div>
                <div className="timeline">
                  {timeline.map((step, i) => (
                    <div key={step.status} className="timeline-step">
                      <div className="tl-icon-col">
                        <div className={`tl-dot${step.active ? ' active' : step.completed ? ' completed' : ''}`} />
                        {i < timeline.length - 1 && <div className={`tl-line${step.completed ? ' completed' : ''}`} />}
                      </div>
                      <div className="tl-content">
                        <div className={`tl-label ${step.active ? 'active' : step.completed ? 'completed' : 'pending'}`}>
                          {step.status}
                          {step.active && <span style={{ fontSize:'0.72rem', marginLeft:'0.5rem', opacity:0.7 }}>← Current</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              {order.order_items?.length > 0 && (
                <>
                  <div style={{ fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Items Ordered</div>
                  <div className="order-items-list">
                    {order.order_items.map((item, i) => (
                      <div key={i} className="order-item-row">
                        <span>{item.name} × {item.quantity}</span>
                        <span style={{ color:'var(--gold)' }}>{php(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:'0.75rem' }}>
                    <div className="summary-row"><span>Subtotal</span><span>{php(order.subtotal)}</span></div>
                    <div className="summary-row"><span>Tax</span><span>{php(order.tax)}</span></div>
                    {order.delivery_fee > 0 && <div className="summary-row"><span>Delivery Fee</span><span>{php(order.delivery_fee)}</span></div>}
                    <div className="summary-total"><span>Total</span><span>{php(order.total)}</span></div>
                  </div>
                </>
              )}

              {order.notes && (
                <div style={{ marginTop:'1rem', background:'var(--navy-mid)', padding:'0.75rem 1rem', borderRadius:'8px', fontSize:'0.85rem', color:'var(--text-muted)' }}>
                  <strong style={{ color:'var(--cream)' }}>Notes:</strong> {order.notes}
                </div>
              )}

              <button className="clear-btn" style={{ marginTop:'1.5rem' }} onClick={() => { setOrder(null); setTimeline([]); setOrderId(''); setIdentity(''); setStatus('idle') }}>
                Track Another Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
