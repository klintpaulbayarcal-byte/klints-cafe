'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/* ── Types ── */
interface Product { id:number; name:string; category:string; description:string; price:number; stock_quantity:number; image_url:string; is_available:boolean; is_featured:boolean }
interface Order { id:number; customer_name:string; customer_phone:string; order_type:string; payment_method:string; status:string; total:number; created_at:string; order_items?:{name:string;quantity:number;price:number}[] }
interface StaffUser { id:number; full_name:string; username:string; email:string; role:string; created_at:string }
interface Report { id:number; staff_name:string; report_date:string; shift:string; total_sales:number; total_orders:number; cash_on_hand:number; notes:string; is_read:boolean; submitted_at:string }
interface Review { id:number; order_id:number; customer_name:string; product_name:string; rating:number; review_text:string; created_at:string }
interface AdminStats { todayOrders:number; todayRevenue:number; monthRevenue:number; yearRevenue:number; pendingTasks:number; weeklyChart:{date:string;total:number}[]; topProducts:{name:string;units:number;sales:number}[]; paymentBreakdown:{method:string;orders:number;total:number}[]; unreadReports:number }
interface User { id:number; username:string; full_name:string; role:string }

function php(n: number) { return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n) }
function fmtDate(d: string) { return new Date(d).toLocaleString('en-PH',{dateStyle:'short',timeStyle:'short'}) }
const CATS = ['coffee','non-coffee','food','pastry']
const STATUS_LIST = ['Received','Processing','Out for Delivery','Ready','Completed','Cancelled']
const PERM = [
  { feature:'Open management dashboard', admin:true, staff:true, user:false },
  { feature:'Manage products (add/edit/delete)', admin:true, staff:true, user:false },
  { feature:'Update order status', admin:true, staff:true, user:false },
  { feature:'Create staff accounts', admin:true, staff:false, user:false },
  { feature:'Edit roles and reset user passwords', admin:true, staff:false, user:false },
  { feature:'Place order from customer page', admin:true, staff:true, user:true },
  { feature:'Track order (public page)', admin:true, staff:true, user:true },
]

export default function AdminPage() {
  const router = useRouter()
  const [user,      setUser]      = useState<User|null>(null)
  const [tab,       setTab]       = useState<'products'|'orders'|'staff'|'reports'|'reviews'>('products')
  const [loading,   setLoading]   = useState(true)
  const [menuOpen,  setMenuOpen]  = useState(false)

  /* Data */
  const [products,  setProducts]  = useState<Product[]>([])
  const [orders,    setOrders]    = useState<Order[]>([])
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [reports,   setReports]   = useState<Report[]>([])
  const [reviews,   setReviews]   = useState<Review[]>([])
  const [adminStats,setAdminStats]= useState<AdminStats|null>(null)
  const [unread,    setUnread]    = useState(0)
  const [detail,    setDetail]    = useState<Order|null>(null)

  /* Product form */
  const [editProduct,    setEditProduct]    = useState<Product|null>(null)
  const [pName,          setPName]          = useState('')
  const [pCat,           setPCat]           = useState('coffee')
  const [pDesc,          setPDesc]          = useState('')
  const [pPrice,         setPPrice]         = useState('')
  const [pStock,         setPStock]         = useState('20')
  const [pImg,           setPImg]           = useState('')
  const [pAvail,         setPAvail]         = useState(true)
  const [pFeatured,      setPFeatured]      = useState(false)
  const [productMsg,     setProductMsg]     = useState('')
  const [productMsgType, setProductMsgType] = useState<'ok'|'err'>('ok')

  /* Staff form */
  const [sName, setSName] = useState('')
  const [sEmail,setSEmail]= useState('')
  const [sUser, setSUser] = useState('')
  const [sPass, setSPass] = useState('')
  const [sRole, setSRole] = useState('staff')
  const [staffMsg,setStaffMsg]= useState('')
  const [staffMsgType,setStaffMsgType]= useState<'ok'|'err'>('ok')

  /* Order filters */
  const [oStatus, setOStatus] = useState('all')
  const [oSearch, setOSearch] = useState('')
  const [oFrom,   setOFrom]   = useState('')
  const [oTo,     setOTo]     = useState('')

  /* Review filters */
  const [rRating, setRRating] = useState('all')

  const fetchProducts  = useCallback(async () => { const d = await fetch('/api/admin/products').then(r=>r.json()); if(d.success) setProducts(d.products) }, [])
  const fetchOrders    = useCallback(async () => {
    const q = new URLSearchParams()
    if (oStatus !== 'all') q.set('status', oStatus)
    if (oSearch) q.set('search', oSearch)
    if (oFrom)   q.set('date_from', oFrom)
    if (oTo)     q.set('date_to', oTo)
    const d = await fetch(`/api/orders?${q}`).then(r=>r.json()); if(d.success) setOrders(d.orders)
  }, [oStatus, oSearch, oFrom, oTo])
  const fetchStaff     = useCallback(async () => { const d = await fetch('/api/admin/staff').then(r=>r.json()); if(d.success) setStaffList(d.staff) }, [])
  const fetchReports   = useCallback(async () => { const d = await fetch('/api/staff/reports').then(r=>r.json()); if(d.success) setReports(d.reports) }, [])
  const fetchReviews   = useCallback(async () => { const q = new URLSearchParams(); if(rRating!=='all') q.set('rating',rRating); const d = await fetch(`/api/admin/reviews?${q}`).then(r=>r.json()); if(d.success) setReviews(d.reviews) }, [rRating])
  const fetchAdminStats= useCallback(async () => { const d = await fetch('/api/admin/reports').then(r=>r.json()); if(d.success){ setAdminStats(d); setUnread(d.unreadReports??0) }}, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => {
      if (!d.success || d.user?.role !== 'admin') router.replace('/login')
      else { setUser(d.user); setLoading(false) }
    })
  }, [router])

  useEffect(() => { if (!loading) { fetchProducts(); fetchOrders(); fetchStaff(); fetchReports(); fetchReviews(); fetchAdminStats() } }, [loading])
  useEffect(() => { if (!loading) fetchOrders() }, [oStatus, oSearch, oFrom, oTo, loading, fetchOrders])
  useEffect(() => { if (!loading) fetchReviews() }, [rRating, loading, fetchReviews])

  async function logout() { await fetch('/api/auth/logout',{method:'POST'}); router.push('/login') }

  function fillProductForm(p: Product) {
    setEditProduct(p); setPName(p.name); setPCat(p.category); setPDesc(p.description)
    setPPrice(String(p.price)); setPStock(String(p.stock_quantity))
    setPImg(p.image_url); setPAvail(p.is_available); setPFeatured(p.is_featured)
  }
  function clearProductForm() { setEditProduct(null); setPName(''); setPCat('coffee'); setPDesc(''); setPPrice(''); setPStock('20'); setPImg(''); setPAvail(true); setPFeatured(false) }

  async function saveProduct() {
    if (!pName.trim() || !pPrice) { setProductMsg('Name and price are required'); setProductMsgType('err'); return }
    const payload = { id: editProduct?.id, name:pName, category:pCat, description:pDesc, price:pPrice, stock_quantity:pStock, image_url:pImg, is_available:pAvail, is_featured:pFeatured }
    const method  = editProduct ? 'PUT' : 'POST'
    const url     = editProduct ? '/api/admin/products' : '/api/products'
    const res     = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
    const d       = await res.json()
    if (d.success) { setProductMsg(editProduct ? 'Product updated!' : 'Product added!'); setProductMsgType('ok'); clearProductForm(); fetchProducts() }
    else           { setProductMsg(d.message); setProductMsgType('err') }
  }

  async function deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return
    await fetch('/api/admin/products',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    fetchProducts()
  }

  async function updateOrderStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})})
    fetchOrders(); fetchAdminStats()
  }

  async function createStaff() {
    if (!sName.trim()||!sEmail.trim()||!sUser.trim()||!sPass.trim()) { setStaffMsg('All fields are required'); setStaffMsgType('err'); return }
    const res = await fetch('/api/admin/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:sName,email:sEmail,username:sUser,password:sPass,role:sRole})})
    const d   = await res.json()
    if (d.success) { setStaffMsg('Staff account created!'); setStaffMsgType('ok'); setSName('');setSEmail('');setSUser('');setSPass(''); fetchStaff() }
    else           { setStaffMsg(d.message); setStaffMsgType('err') }
  }

  async function updateRole(id: number, role: string) {
    await fetch('/api/admin/staff',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,role})})
    fetchStaff()
  }

  async function markReportsRead() {
    await fetch('/api/admin/orders',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({})})
    setUnread(0); fetchReports()
  }

  if (loading) return <div className="loader-wrap" style={{height:'100vh'}}><div className="loader"/></div>

  /* ── Mini bar chart ── */
  function BarChart({ data, color='var(--gold)' }: { data:{label:string;value:number}[]; color?:string }) {
    const max = Math.max(...data.map(d=>d.value), 1)
    return (
      <div style={{display:'flex',alignItems:'flex-end',gap:'4px',height:'80px',marginTop:'8px'}}>
        {data.map((d,i)=>(
          <div key={i} title={`${d.label}: ${php(d.value)}`} style={{flex:1,background:color,borderRadius:'3px 3px 0 0',height:`${(d.value/max)*100}%`,minHeight:'2px',transition:'height 0.5s',opacity:0.85}}/>
        ))}
      </div>
    )
  }

  function LineChart({ data }: { data:{date:string;total:number}[] }) {
    if (data.length < 2) return <div style={{color:'var(--text-muted)',fontSize:'0.8rem',padding:'1rem 0'}}>Not enough data</div>
    const max = Math.max(...data.map(d=>d.total), 1)
    const w=300, h=80, pad=10
    const pts = data.map((d,i)=>[pad + (i/(data.length-1))*(w-pad*2), h-pad - (d.total/max)*(h-pad*2)] as [number,number])
    const pathD = pts.map((p,i)=>`${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    const areaD = `${pathD} L${pts[pts.length-1][0].toFixed(1)},${h-pad} L${pts[0][0].toFixed(1)},${h-pad} Z`
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:'80px'}}>
        <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity="0.4"/><stop offset="100%" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs>
        <path d={areaD} fill="url(#grad)"/>
        <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#60a5fa"/>)}
      </svg>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--navy)',color:'var(--text)'}}>
      {/* Admin Topbar */}
      <div className="admin-topbar">
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <button className="menu-toggle" onClick={()=>setMenuOpen(o=>!o)}>☰</button>
          <span className="admin-topbar-title">Store Management Dashboard</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
          <span className="admin-user-info">Logged in as <strong style={{color:'var(--cream)'}}>{user?.full_name}</strong> ({user?.role})</span>
          <button className="manage-btn" onClick={()=>router.push('/')}>Open Customer View</button>
          <button className="manage-btn" onClick={()=>router.push('/staff')}>Staff View</button>
          <button className="manage-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'1.5rem 2rem'}}>
        {/* Notification banner */}
        {unread > 0 && (
          <div className="notif-banner">
            <span className="notif-text"><strong>Notification:</strong> {unread} new staff sales report(s) submitted.</span>
            <button className="manage-btn" style={{borderColor:'#60a5fa',color:'#60a5fa'}} onClick={()=>{setTab('reports');markReportsRead()}}>View Reports</button>
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar">
          {(['products','orders','staff','reports','reviews'] as const).map(t=>(
            <button key={t} className={`tab-item${tab===t?' active':''}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t==='reports' && unread>0 && <span className="tab-badge">{unread}</span>}
            </button>
          ))}
        </div>

        {/* ── PRODUCTS TAB ── */}
        {tab==='products' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:'2rem',alignItems:'start'}}>
            {/* Form */}
            <div className="form-card">
              <div className="form-card-title">{editProduct ? `Edit: ${editProduct.name}` : 'Add Product'}</div>
              <div className="form-grid">
                <div className="full-col">
                  <label className="form-lbl">Product Name</label>
                  <input className="form-inp" placeholder="Product Name" value={pName} onChange={e=>setPName(e.target.value)}/>
                </div>
                <div>
                  <label className="form-lbl">Category</label>
                  <select className="form-sel" value={pCat} onChange={e=>setPCat(e.target.value)}>
                    {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-lbl">Price (PHP)</label>
                  <input className="form-inp" placeholder="0.00" type="number" value={pPrice} onChange={e=>setPPrice(e.target.value)}/>
                </div>
                <div className="full-col">
                  <label className="form-lbl">Description</label>
                  <textarea className="form-ta" placeholder="Description..." value={pDesc} onChange={e=>setPDesc(e.target.value)}/>
                </div>
                <div>
                  <label className="form-lbl">Stock Quantity</label>
                  <input className="form-inp" type="number" value={pStock} onChange={e=>setPStock(e.target.value)}/>
                </div>
                <div>
                  <label className="form-lbl">Image URL</label>
                  <input className="form-inp" placeholder="https://..." value={pImg} onChange={e=>setPImg(e.target.value)}/>
                </div>
                {pImg && <div className="full-col"><img src={pImg} alt="preview" className="img-preview" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/></div>}
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <input type="checkbox" id="avail" checked={pAvail} onChange={e=>setPAvail(e.target.checked)} style={{accentColor:'var(--gold)'}}/>
                  <label htmlFor="avail" className="form-lbl" style={{marginBottom:0}}>Available for ordering</label>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <input type="checkbox" id="feat" checked={pFeatured} onChange={e=>setPFeatured(e.target.checked)} style={{accentColor:'var(--gold)'}}/>
                  <label htmlFor="feat" className="form-lbl" style={{marginBottom:0}}>Best Seller / Featured</label>
                </div>
              </div>
              <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                <button className="submit-btn" style={{flex:1}} onClick={saveProduct}>{editProduct?'Update Product':'Add Product'}</button>
                {editProduct && <button className="reset-btn" onClick={clearProductForm}>Cancel</button>}
              </div>
              {productMsg && <div className={productMsgType==='ok'?'alert-success':'alert-error'} style={{marginTop:'0.75rem'}}>{productMsg}</div>}
            </div>

            {/* Product list */}
            <div className="table-card">
              <div className="table-card-header"><span className="table-card-title">Current Menu</span><span style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{products.length} items</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {products.map(p=>(
                      <tr key={p.id}>
                        <td>
                          <div style={{fontWeight:500,color:'var(--cream)'}}>{p.name}</div>
                          <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.15rem'}}>{p.description}</div>
                        </td>
                        <td><span className="tag-coffee">{p.category}</span></td>
                        <td style={{color:'var(--gold)'}}>{php(p.price)}</td>
                        <td>
                          <span style={{display:'inline-block',padding:'0.2rem 0.5rem',borderRadius:'4px',fontSize:'0.75rem',fontWeight:700,background:p.stock_quantity<=5?'rgba(217,68,68,0.15)':'rgba(42,157,78,0.15)',color:p.stock_quantity<=5?'#f87171':'#4ade80'}}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td><span className={p.is_available?'tag-available':'tag-unavailable'}>{p.is_available?'Available':'Unavailable'}</span></td>
                        <td style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                          <button className="action-btn action-edit" onClick={()=>fillProductForm(p)}>Edit</button>
                          <button className="action-btn action-delete" onClick={()=>deleteProduct(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {products.length===0&&<tr><td colSpan={6} className="empty-state">No products found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab==='orders' && (
          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">Incoming Orders</span>
              <span style={{background:'rgba(229,160,32,0.15)',color:'#fbbf24',padding:'0.3rem 0.8rem',borderRadius:'6px',fontSize:'0.8rem'}}>
                Live Queue: {orders.filter(o=>['Received','Processing','Out for Delivery'].includes(o.status)).length} active orders
              </span>
            </div>
            <div className="filter-row">
              <select className="filter-input" value={oStatus} onChange={e=>setOStatus(e.target.value)}>
                <option value="all">All</option>
                {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
              <input type="date" className="filter-input" placeholder="From" value={oFrom} onChange={e=>setOFrom(e.target.value)}/>
              <input type="date" className="filter-input" placeholder="To" value={oTo} onChange={e=>setOTo(e.target.value)}/>
              <input className="filter-input" style={{flex:1,minWidth:'200px'}} placeholder="Customer, phone, or order #" value={oSearch} onChange={e=>setOSearch(e.target.value)}/>
              <button className="filter-btn" onClick={fetchOrders}>Apply Filters</button>
              <button className="reset-btn" onClick={()=>{setOStatus('all');setOSearch('');setOFrom('');setOTo('')}}>Clear</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Created</th><th>Receipts</th><th>Details</th></tr></thead>
                <tbody>
                  {orders.map(o=>(
                    <tr key={o.id}>
                      <td style={{color:'var(--text-muted)'}} >#{o.id}</td>
                      <td>
                        <div style={{color:'var(--cream)',fontWeight:500}}>{o.customer_name}</div>
                        <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{o.customer_phone||'–'}</div>
                        <div style={{fontSize:'0.72rem',color:'var(--text-muted)',textTransform:'uppercase'}}>{o.order_type} | {o.payment_method}</div>
                      </td>
                      <td style={{fontSize:'0.82rem',maxWidth:'200px'}}>
                        {o.order_items?.map(i=>`${i.name} x${i.quantity}`).join(', ')||'–'}
                      </td>
                      <td style={{color:'var(--gold)',fontWeight:600}}>{php(o.total)}</td>
                      <td>
                        <select className="status-select" value={o.status} onChange={e=>updateOrderStatus(o.id,e.target.value)}>
                          {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{fontSize:'0.75rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{fmtDate(o.created_at)}</td>
                      <td style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                        <button className="action-btn action-view" style={{fontSize:'0.72rem'}} onClick={()=>setDetail(o)}>Customer</button>
                        <button className="action-btn" style={{background:'rgba(42,157,78,0.15)',color:'#4ade80',fontSize:'0.72rem'}} onClick={()=>setDetail(o)}>Kitchen</button>
                      </td>
                      <td><button className="manage-btn" onClick={()=>setDetail(o)}>View</button></td>
                    </tr>
                  ))}
                  {orders.length===0&&<tr><td colSpan={8} className="empty-state">No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STAFF TAB ── */}
        {tab==='staff' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:'2rem',alignItems:'start'}}>
            {/* Create form */}
            <div className="form-card">
              <div className="form-card-title">Add Staff Account</div>
              <label className="form-lbl">Full Name</label>
              <input className="form-inp" value={sName} onChange={e=>setSName(e.target.value)} placeholder="Full Name"/>
              <label className="form-lbl">Email</label>
              <input className="form-inp" type="email" value={sEmail} onChange={e=>setSEmail(e.target.value)} placeholder="email@example.com"/>
              <label className="form-lbl">Username</label>
              <input className="form-inp" value={sUser} onChange={e=>setSUser(e.target.value)} placeholder="username"/>
              <label className="form-lbl">Temporary Password</label>
              <input className="form-inp" type="password" value={sPass} onChange={e=>setSPass(e.target.value)} placeholder="••••••••"/>
              <label className="form-lbl">Role</label>
              <select className="form-sel" value={sRole} onChange={e=>setSRole(e.target.value)}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button className="submit-btn" onClick={createStaff}>Create Staff</button>
              {staffMsg&&<div className={staffMsgType==='ok'?'alert-success':'alert-error'} style={{marginTop:'0.75rem'}}>{staffMsg}</div>}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
              {/* Permissions matrix */}
              <div className="form-card">
                <div className="form-card-title">Role Permissions Matrix</div>
                <div className="table-wrap">
                  <table className="perm-matrix">
                    <thead><tr><th>Feature</th><th style={{textAlign:'center'}}>Admin</th><th style={{textAlign:'center'}}>Staff</th><th style={{textAlign:'center'}}>User</th></tr></thead>
                    <tbody>
                      {PERM.map((row,i)=>(
                        <tr key={i}>
                          <td style={{color:'var(--text)'}}>{row.feature}</td>
                          <td style={{textAlign:'center'}}><span className={row.admin?'perm-yes':'perm-no'}>{row.admin?'Yes':'No'}</span></td>
                          <td style={{textAlign:'center'}}><span className={row.staff?'perm-yes':'perm-no'}>{row.staff?'Yes':'No'}</span></td>
                          <td style={{textAlign:'center'}}><span className={row.user?'perm-yes':'perm-no'}>{row.user?'Yes':'No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Staff accounts */}
              <div className="table-card">
                <div className="table-card-header">
                  <span className="table-card-title">Staff Accounts</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                    <tbody>
                      {staffList.map(s=>(
                        <tr key={s.id}>
                          <td style={{color:'var(--cream)'}}>{s.full_name}</td>
                          <td style={{color:'var(--text-muted)'}}>{s.username}</td>
                          <td style={{fontSize:'0.82rem'}}>{s.email}</td>
                          <td><span className={`role-badge ${s.role==='admin'?'role-admin':'role-staff'}`}>{s.role}</span></td>
                          <td style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                            <button className="action-btn action-edit" onClick={()=>updateRole(s.id, s.role==='admin'?'staff':'admin')}>Edit Role</button>
                            <button className="action-btn" style={{background:'rgba(96,165,250,0.15)',color:'#60a5fa'}}
                              onClick={async()=>{ const p=prompt('New password for '+s.username+':'); if(p) { await fetch('/api/admin/staff',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:s.id,password:p})}); alert('Password reset!') }}}>
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                      {staffList.length===0&&<tr><td colSpan={5} className="empty-state">No staff accounts</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab==='reports' && adminStats && (
          <>
            {unread>0&&(
              <div style={{background:'rgba(229,160,32,0.1)',border:'1px solid rgba(229,160,32,0.25)',borderRadius:'10px',padding:'0.85rem 1.25rem',marginBottom:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{color:'#fcd34d',fontSize:'0.88rem'}}>⚠ <strong>Staff Submissions Alert:</strong> {unread} unread sales report(s).</span>
                <button className="manage-btn" onClick={markReportsRead}>Mark All As Read</button>
              </div>
            )}

            {/* Summary cards */}
            <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
              <div className="stat-card"><div className="stat-card-label">Today&apos;s Orders</div><div className="stat-card-value">{adminStats.todayOrders}</div></div>
              <div className="stat-card"><div className="stat-card-label">Today&apos;s Revenue</div><div className="stat-card-value gold">{php(adminStats.todayRevenue)}</div></div>
              <div className="stat-card"><div className="stat-card-label">This Month</div><div className="stat-card-value blue">{php(adminStats.monthRevenue)}</div></div>
              <div className="stat-card"><div className="stat-card-label">This Year</div><div className="stat-card-value blue">{php(adminStats.yearRevenue)}</div></div>
            </div>

            {/* Revenue Charts */}
            <div style={{marginBottom:'1.5rem'}}>
              <div style={{fontSize:'0.82rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:'1rem'}}>Revenue Charts</div>
              <div className="charts-row">
                <div className="chart-card">
                  <div className="chart-title">Weekly Revenue (Daily)</div>
                  <LineChart data={adminStats.weeklyChart}/>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:'var(--text-muted)',marginTop:'4px'}}>
                    {adminStats.weeklyChart.slice(0,1).map(d=><span key={d.date}>{d.date}</span>)}
                    {adminStats.weeklyChart.slice(-1).map(d=><span key={d.date}>{d.date}</span>)}
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-title">Weekly Revenue (Bar)</div>
                  <BarChart data={adminStats.weeklyChart.map(d=>({label:d.date,value:d.total}))} color="var(--green)"/>
                </div>
                <div className="chart-card">
                  <div className="chart-title">Payment Methods</div>
                  <BarChart data={adminStats.paymentBreakdown.map(d=>({label:d.method,value:d.total}))} color="var(--gold)"/>
                </div>
              </div>
            </div>

            {/* Top Products & Payment Breakdown */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
              <div className="table-card">
                <div className="table-card-header"><span className="table-card-title">Top Products/Services</span></div>
                <div className="table-wrap">
                  <table><thead><tr><th>Product</th><th>Units Sold</th><th>Sales</th></tr></thead>
                    <tbody>{adminStats.topProducts.map((p,i)=>(
                      <tr key={i}><td style={{color:'var(--cream)'}}>{p.name}</td><td>{p.units}</td><td style={{color:'var(--gold)'}}>{php(p.sales)}</td></tr>
                    ))}{adminStats.topProducts.length===0&&<tr><td colSpan={3} className="empty-state">No data</td></tr>}</tbody>
                  </table>
                </div>
              </div>
              <div className="table-card">
                <div className="table-card-header"><span className="table-card-title">Payment Breakdown</span></div>
                <div className="table-wrap">
                  <table><thead><tr><th>Method</th><th>Orders</th><th>Total</th></tr></thead>
                    <tbody>{adminStats.paymentBreakdown.map((p,i)=>(
                      <tr key={i}><td style={{textTransform:'uppercase',fontSize:'0.82rem'}}>{p.method}</td><td>{p.orders}</td><td style={{color:'var(--gold)'}}>{php(p.total)}</td></tr>
                    ))}{adminStats.paymentBreakdown.length===0&&<tr><td colSpan={3} className="empty-state">No data</td></tr>}</tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Staff Reports */}
            <div className="table-card">
              <div className="table-card-header">
                <span className="table-card-title">Staff Sales Reports</span>
                {unread>0&&<button className="manage-btn" onClick={markReportsRead}>Mark All As Read</button>}
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Staff</th><th>Date</th><th>Shift</th><th>Total Sales</th><th>Orders</th><th>Cash on Hand</th><th>Notes</th><th>Submitted</th><th>Read</th></tr></thead>
                  <tbody>
                    {reports.map(r=>(
                      <tr key={r.id}>
                        <td style={{color:'var(--cream)'}}>{r.staff_name}</td>
                        <td>{r.report_date}</td>
                        <td>{r.shift}</td>
                        <td style={{color:'var(--gold)'}}>{php(r.total_sales)}</td>
                        <td>{r.total_orders}</td>
                        <td>{php(r.cash_on_hand)}</td>
                        <td style={{fontSize:'0.8rem',color:'var(--text-muted)',maxWidth:'150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.notes||'–'}</td>
                        <td style={{fontSize:'0.75rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{fmtDate(r.submitted_at)}</td>
                        <td><span className={r.is_read?'tag-available':'tag-unavailable'}>{r.is_read?'Read':'Unread'}</span></td>
                      </tr>
                    ))}
                    {reports.length===0&&<tr><td colSpan={9} className="empty-state">No reports submitted</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── REVIEWS TAB ── */}
        {tab==='reviews' && (
          <div className="table-card">
            <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid var(--border)',display:'flex',gap:'1rem',flexWrap:'wrap',alignItems:'center'}}>
              <div>
                <label className="form-lbl" style={{display:'inline'}}>Rating </label>
                <select className="filter-input" style={{marginLeft:'0.5rem'}} value={rRating} onChange={e=>setRRating(e.target.value)}>
                  <option value="all">All</option>
                  {[5,4,3,2,1].map(n=><option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
              <button className="filter-btn" onClick={fetchReviews}>Filter</button>
            </div>
            <div className="table-card-header"><span className="table-card-title">Customer Reviews</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Rating</th><th>Review</th><th>Date</th></tr></thead>
                <tbody>
                  {reviews.map(r=>(
                    <tr key={r.id}>
                      <td style={{color:'var(--text-muted)'}}>#{r.order_id}</td>
                      <td style={{color:'var(--cream)'}}>{r.customer_name}</td>
                      <td>{r.product_name||'–'}</td>
                      <td style={{color:'var(--gold)'}}>{'★'.repeat(r.rating||0)}{'☆'.repeat(5-(r.rating||0))}</td>
                      <td style={{maxWidth:'200px',fontSize:'0.85rem'}}>{r.review_text||'–'}</td>
                      <td style={{fontSize:'0.75rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{fmtDate(r.created_at)}</td>
                    </tr>
                  ))}
                  {reviews.length===0&&<tr><td colSpan={6} className="empty-state">No reviews found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── ORDER DETAIL MODAL ── */}
      {detail&&(
        <div className="modal-overlay" onClick={()=>setDetail(null)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">
              <span>Order #{detail.id} — {detail.customer_name}</span>
              <button className="modal-close" onClick={()=>setDetail(null)}>×</button>
            </div>
            <div className="detail-row"><span className="detail-label">Status</span>
              <select className="status-select" value={detail.status} onChange={e=>{updateOrderStatus(detail.id,e.target.value);setDetail({...detail,status:e.target.value})}}>
                {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{detail.customer_phone||'–'}</span></div>
            <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value" style={{textTransform:'capitalize'}}>{detail.order_type}</span></div>
            <div className="detail-row"><span className="detail-label">Payment</span><span className="detail-value" style={{textTransform:'uppercase'}}>{detail.payment_method}</span></div>
            <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{fmtDate(detail.created_at)}</span></div>
            <div style={{marginTop:'0.75rem',fontSize:'0.78rem',color:'var(--text-muted)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'0.5rem'}}>Items</div>
            {detail.order_items?.map((item,i)=>(
              <div key={i} className="detail-row">
                <span className="detail-label">{item.name} × {item.quantity}</span>
                <span className="detail-value">{php(item.price*item.quantity)}</span>
              </div>
            ))}
            <div className="detail-row" style={{borderTop:'1px solid var(--border)',paddingTop:'0.75rem',marginTop:'0.25rem'}}>
              <span className="detail-label" style={{color:'var(--cream)',fontWeight:600}}>Total</span>
              <span className="detail-value" style={{color:'var(--gold)',fontWeight:700}}>{php(detail.total)}</span>
            </div>
            <div style={{marginTop:'1rem',display:'flex',justifyContent:'flex-end'}}>
              <button className="manage-btn" onClick={()=>setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
