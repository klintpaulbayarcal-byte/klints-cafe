'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Order {
  id: number; customer_name: string; customer_phone: string
  order_type: string; payment_method: string; status: string
  total: number; created_at: string
  order_items?: { name: string; quantity: number; price: number }[]
}
interface Stats {
  pending: number; todayOrders: number; totalOrders: number
  todayRevenue: number; monthRevenue: number; yearRevenue: number
  inProgress: number; pickup: number; delivery: number
  liveActive: number; lowStock: { id:number; name:string; stock_quantity:number }[]
}
interface Report {
  id: number; report_date: string; shift: string
  total_sales: number; total_orders: number; submitted_at: string; staff_name: string
}
interface User { id: number; username: string; full_name: string; role: string }

function php(n: number) {
  return new Intl.NumberFormat('en-PH', { style:'currency', currency:'PHP' }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-PH', { dateStyle:'short', timeStyle:'short' })
}

const STATUS_LIST = ['Received','Processing','Out for Delivery','Ready','Completed','Cancelled']

export default function StaffPage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [orders,   setOrders]   = useState<Order[]>([])
  const [reports,  setReports]  = useState<Report[]>([])
  const [view,     setView]     = useState<'dashboard'|'orders'|'report'>('dashboard')
  const [loading,  setLoading]  = useState(true)
  const [sideOpen, setSideOpen] = useState(false)
  const [detail,   setDetail]   = useState<Order|null>(null)

  // Filters
  const [fStatus, setFStatus] = useState('all')
  const [fType,   setFType]   = useState('all')
  const [fDate,   setFDate]   = useState('')
  const [fSearch, setFSearch] = useState('')

  // Report form
  const [rDate,   setRDate]   = useState(new Date().toISOString().split('T')[0])
  const [rShift,  setRShift]  = useState('Full Day')
  const [rSales,  setRSales]  = useState('')
  const [rOrders, setROrders] = useState('')
  const [rCash,   setRCash]   = useState('')
  const [rNotes,  setRNotes]  = useState('')
  const [rStatus, setRStatus] = useState<'idle'|'ok'|'err'>('idle')
  const [rMsg,    setRMsg]    = useState('')

  const fetchStats  = useCallback(async () => {
    const d = await fetch('/api/staff/dashboard').then(r => r.json())
    if (d.success) setStats(d.stats)
  }, [])

  const fetchOrders = useCallback(async () => {
    const q = new URLSearchParams()
    if (fStatus && fStatus !== 'all') q.set('status', fStatus)
    if (fType   && fType   !== 'all') q.set('type', fType)
    if (fDate)   q.set('date_from', fDate)
    if (fSearch) q.set('search', fSearch)
    const d = await fetch(`/api/orders?${q}`).then(r => r.json())
    if (d.success) setOrders(d.orders)
  }, [fStatus, fType, fDate, fSearch])

  const fetchReports = useCallback(async () => {
    const d = await fetch('/api/staff/reports').then(r => r.json())
    if (d.success) setReports(d.reports)
  }, [])

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.success || !['staff','admin'].includes(d.user?.role)) {
        router.replace('/login')
      } else {
        setUser(d.user)
        setLoading(false)
      }
    })
  }, [router])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (loading) return
    fetchStats(); fetchOrders(); fetchReports()
    const interval = setInterval(() => { fetchStats(); fetchOrders() }, 10000)
    return () => clearInterval(interval)
  }, [loading, fetchStats, fetchOrders, fetchReports])

  useEffect(() => { if (!loading) fetchOrders() }, [fStatus, fType, fDate, fSearch, loading, fetchOrders])

  async function updateStatus(orderId: number, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchOrders(); fetchStats()
  }

  async function submitReport() {
    setRStatus('idle'); setRMsg('')
    try {
      const res = await fetch('/api/staff/reports', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ report_date:rDate, shift:rShift, total_sales:rSales, total_orders:rOrders, cash_on_hand:rCash, notes:rNotes }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setRStatus('ok'); setRMsg('Report submitted successfully!')
      setRSales(''); setROrders(''); setRCash(''); setRNotes('')
      fetchReports()
    } catch (e: unknown) {
      setRStatus('err'); setRMsg(e instanceof Error ? e.message : 'Failed to submit')
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' })
    router.push('/login')
  }

  if (loading) return <div className="loader-wrap" style={{ height:'100vh' }}><div className="loader" /></div>

  const STATUS_COLOR: Record<string,string> = {
    Received:'#60a5fa', Processing:'#fbbf24', 'Out for Delivery':'#2dd4bf',
    Ready:'#c084fc', Completed:'#4ade80', Cancelled:'#f87171'
  }

  return (
    <div className="dash-layout">
      {/* Overlay for mobile sidebar */}
      {sideOpen && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:49 }} onClick={() => setSideOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`dash-sidebar${sideOpen ? ' open' : ''}`}>
        <div className="dash-brand">
          <div className="dash-brand-name">Klint&apos;s Cafe</div>
          <div className="dash-brand-sub">Staff Operations</div>
        </div>
        <nav className="dash-nav">
          <div className="dash-nav-label">Main Menu</div>
          <button className={`dash-nav-item${view==='dashboard'?' active':''}`} onClick={() => { setView('dashboard'); setSideOpen(false) }}>
            📊 Dashboard
          </button>
          <button className={`dash-nav-item${view==='orders'?' active':''}`} onClick={() => { setView('orders'); setSideOpen(false) }}>
            🛒 Orders
          </button>
          <button className={`dash-nav-item${view==='report'?' active':''}`} onClick={() => { setView('report'); setSideOpen(false) }}>
            📋 Submit Sales Report
          </button>
          <div className="dash-nav-label" style={{ marginTop:'1rem' }}>Reports</div>
          <button className="dash-nav-item" onClick={() => setView('orders')}>📅 Today&apos;s Sales</button>
          <button className="dash-nav-item" onClick={() => setView('orders')}>📆 This Month&apos;s Sales</button>
          <button className="dash-nav-item" onClick={() => setView('orders')}>🗓 This Year&apos;s Sales</button>
          <div className="dash-nav-label" style={{ marginTop:'1rem' }}>Filters</div>
          <select className="filter-input" style={{ margin:'0 1rem', width:'calc(100% - 2rem)' }} value={fStatus} onChange={e => { setFStatus(e.target.value); setView('orders') }}>
            <option value="all">All Statuses</option>
            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-input" style={{ margin:'0.5rem 1rem 0', width:'calc(100% - 2rem)' }} value={fType} onChange={e => { setFType(e.target.value); setView('orders') }}>
            <option value="all">All Types</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
          <input type="date" className="filter-input" style={{ margin:'0.5rem 1rem 0', width:'calc(100% - 2rem)' }} value={fDate} onChange={e => setFDate(e.target.value)} />
          {(fStatus !== 'all' || fType !== 'all' || fDate) && (
            <button className="reset-btn" style={{ margin:'0.5rem 1rem 0', width:'calc(100% - 2rem)', textAlign:'center' }} onClick={() => { setFStatus('all'); setFType('all'); setFDate('') }}>Reset</button>
          )}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-page-title">
              <button className="menu-toggle" style={{ marginRight:'0.5rem' }} onClick={() => setSideOpen(o => !o)}>☰</button>
              {view === 'dashboard' ? 'Dashboard' : view === 'orders' ? 'All Orders' : 'Submit Sales Report'}
            </h1>
            <p className="dash-page-sub">Welcome back, {user?.full_name}</p>
          </div>
          <div className="dash-actions">
            <button className="manage-btn" onClick={() => router.push('/')}>🏠 Customer View</button>
            {user?.role === 'admin' && <button className="manage-btn" style={{ borderColor:'var(--gold)', color:'var(--gold)' }} onClick={() => router.push('/admin')}>⚙ Admin Panel</button>}
            <button className="manage-btn" onClick={logout}>Logout</button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {stats?.lowStock && stats.lowStock.length > 0 && (
          <div className="notif-banner" style={{ background:'rgba(217,68,68,0.08)', borderColor:'rgba(217,68,68,0.25)', marginBottom:'1.5rem' }}>
            <span className="notif-text" style={{ color:'#fca5a5' }}>
              ⚠ <strong>Low Stock Alert:</strong> {stats.lowStock.map(p => `${p.name} (${p.stock_quantity})`).join(', ')}
            </span>
          </div>
        )}

        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-card-label">Pending Orders</div><div className="stat-card-value amber">{stats.pending}</div></div>
              <div className="stat-card"><div className="stat-card-label">Today&apos;s Orders</div><div className="stat-card-value">{stats.todayOrders}</div></div>
              <div className="stat-card"><div className="stat-card-label">Total Orders</div><div className="stat-card-value">{stats.totalOrders}</div></div>
              <div className="stat-card"><div className="stat-card-label">Today&apos;s Revenue</div><div className="stat-card-value gold">{php(stats.todayRevenue)}</div></div>
              <div className="stat-card"><div className="stat-card-label">This Month</div><div className="stat-card-value blue">{php(stats.monthRevenue)}</div></div>
              <div className="stat-card"><div className="stat-card-label">This Year</div><div className="stat-card-value blue">{php(stats.yearRevenue)}</div></div>
              <div className="stat-card"><div className="stat-card-label">In Progress</div><div className="stat-card-value amber">{stats.inProgress}</div></div>
              <div className="stat-card" style={{ cursor:'pointer' }} onClick={() => router.push('/admin')}>
                <div className="stat-card-label">Live Active Orders</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div className="stat-card-value">{stats.liveActive}</div>
                  <span style={{ fontSize:'0.72rem', color:'#60a5fa' }}>Live updates →</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Pickup / Delivery</div>
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'baseline' }}>
                  <span className="stat-card-value green">{stats.pickup}</span>
                  <span style={{ color:'var(--text-muted)' }}>/</span>
                  <span className="stat-card-value" style={{ color:'#f87171' }}>{stats.delivery}</span>
                </div>
              </div>
            </div>

            {/* Recent orders preview */}
            <div className="table-card">
              <div className="table-card-header">
                <span className="table-card-title">Recent Orders</span>
                <button className="manage-btn" onClick={() => setView('orders')}>View All →</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Customer</th><th>Contact</th><th>Total</th><th>Type</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(o => (
                      <tr key={o.id}>
                        <td style={{ color:'var(--text-muted)' }}>#{o.id}</td>
                        <td style={{ color:'var(--cream)' }}>{o.customer_name}</td>
                        <td>{o.customer_phone || '–'}</td>
                        <td style={{ color:'var(--gold)' }}>{php(o.total)}</td>
                        <td style={{ textTransform:'capitalize' }}>{o.order_type}</td>
                        <td style={{ textTransform:'uppercase', fontSize:'0.75rem' }}>{o.payment_method}</td>
                        <td><span className={`status-pill status-${o.status.replace(/\s/g,'')}`}>{o.status}</span></td>
                        <td style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{fmtDate(o.created_at)}</td>
                        <td><button className="manage-btn" onClick={() => setDetail(o)}>Manage</button></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>No orders</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── ORDERS VIEW ── */}
        {view === 'orders' && (
          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">All Orders</span>
              <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Auto-refresh every 10 seconds</span>
            </div>
            <div className="filter-row">
              <select className="filter-input" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="filter-input" value={fType} onChange={e => setFType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
              <input type="date" className="filter-input" value={fDate} onChange={e => setFDate(e.target.value)} placeholder="mm/dd/yyyy" />
              <input className="filter-input" placeholder="Search customer / phone / order #" value={fSearch} onChange={e => setFSearch(e.target.value)} style={{ flex:1, minWidth:'200px' }} />
              <button className="filter-btn" onClick={fetchOrders}>Apply Filters</button>
              <button className="reset-btn" onClick={() => { setFStatus('all'); setFType('all'); setFDate(''); setFSearch('') }}>Reset</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Customer</th><th>Contact</th><th>Total</th><th>Type</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ color:'var(--text-muted)' }}>#{o.id}</td>
                      <td style={{ color:'var(--cream)' }}>{o.customer_name}</td>
                      <td>{o.customer_phone || '–'}</td>
                      <td style={{ color:'var(--gold)' }}>{php(o.total)}</td>
                      <td style={{ textTransform:'capitalize' }}>{o.order_type}</td>
                      <td style={{ textTransform:'uppercase', fontSize:'0.75rem' }}>{o.payment_method}</td>
                      <td>
                        <select className="status-select" value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                          {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize:'0.78rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(o.created_at)}</td>
                      <td><button className="manage-btn" onClick={() => setDetail(o)}>Manage</button></td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={9} className="empty-state">No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SALES REPORT VIEW ── */}
        {view === 'report' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', alignItems:'start' }}>
            {/* Form */}
            <div className="form-card">
              <div className="form-card-title">Submit Sales Report To Admin</div>
              <div className="form-grid">
                <div>
                  <label className="form-lbl">Report Date</label>
                  <input type="date" className="form-inp" value={rDate} onChange={e => setRDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-lbl">Shift</label>
                  <select className="form-sel" value={rShift} onChange={e => setRShift(e.target.value)}>
                    <option>Full Day</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>
                <div>
                  <label className="form-lbl">Total Sales (PHP)</label>
                  <input className="form-inp" placeholder="0.00" value={rSales} onChange={e => setRSales(e.target.value)} type="number" />
                </div>
                <div>
                  <label className="form-lbl">Total Orders</label>
                  <input className="form-inp" placeholder="0" value={rOrders} onChange={e => setROrders(e.target.value)} type="number" />
                </div>
                <div className="full-col">
                  <label className="form-lbl">Cash On Hand (PHP)</label>
                  <input className="form-inp" placeholder="0.00" value={rCash} onChange={e => setRCash(e.target.value)} type="number" />
                </div>
                <div className="full-col">
                  <label className="form-lbl">Notes</label>
                  <textarea className="form-ta" placeholder="Any issue, shortage, overage, or remarks." value={rNotes} onChange={e => setRNotes(e.target.value)} />
                </div>
              </div>
              <button className="submit-btn gold-btn" onClick={submitReport}>Submit Report</button>
              {rStatus === 'ok'  && <div className="alert-success" style={{ marginTop:'0.75rem' }}>{rMsg}</div>}
              {rStatus === 'err' && <div className="alert-error"   style={{ marginTop:'0.75rem' }}>{rMsg}</div>}
            </div>

            {/* My Reports */}
            <div className="table-card">
              <div className="table-card-header"><span className="table-card-title">My Recent Sales Reports</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Shift</th><th>Total Sales</th><th>Orders</th><th>Submitted</th></tr></thead>
                  <tbody>
                    {reports.length === 0
                      ? <tr><td colSpan={5} className="empty-state">No submitted reports yet.</td></tr>
                      : reports.map(r => (
                        <tr key={r.id}>
                          <td>{r.report_date}</td>
                          <td>{r.shift}</td>
                          <td style={{ color:'var(--gold)' }}>{php(r.total_sales)}</td>
                          <td>{r.total_orders}</td>
                          <td style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{fmtDate(r.submitted_at)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── DETAIL MODAL ── */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Order #{detail.id} — {detail.customer_name}</span>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="detail-row"><span className="detail-label">Status</span>
              <select className="status-select" value={detail.status}
                onChange={e => { updateStatus(detail.id, e.target.value); setDetail({ ...detail, status: e.target.value }) }}>
                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{detail.customer_phone || '–'}</span></div>
            <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value" style={{ textTransform:'capitalize' }}>{detail.order_type}</span></div>
            <div className="detail-row"><span className="detail-label">Payment</span><span className="detail-value" style={{ textTransform:'uppercase' }}>{detail.payment_method}</span></div>
            <div className="detail-row"><span className="detail-label">Total</span><span className="detail-value" style={{ color:'var(--gold)', fontWeight:600 }}>{php(detail.total)}</span></div>
            <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{fmtDate(detail.created_at)}</span></div>
            {detail.order_items?.map((item, i) => (
              <div key={i} className="detail-row">
                <span className="detail-label">{item.name} × {item.quantity}</span>
                <span className="detail-value">{php(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
              <button className="manage-btn" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
