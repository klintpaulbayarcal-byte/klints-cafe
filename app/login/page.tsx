'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [status,   setStatus]   = useState<'idle'|'loading'|'err'>('idle')
  const [msg,      setMsg]      = useState('')

  async function login() {
    if (!username.trim() || !password.trim()) {
      setStatus('err'); setMsg('Username and password are required'); return
    }
    setStatus('loading'); setMsg('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)

      if (d.user.role === 'admin') router.push('/admin')
      else router.push('/staff')
    } catch (e: unknown) {
      setStatus('err'); setMsg(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">Klint&apos;s Cafe</div>
          <div className="auth-logo-sub">Staff &amp; Admin Access</div>
        </div>

        <h2 className="auth-title">Sign In</h2>
        <p className="auth-sub">Access your management dashboard</p>

        {status === 'err' && <div className="alert-error" style={{ marginBottom:'1rem' }}>{msg}</div>}

        <label className="form-lbl">Username</label>
        <input className="form-inp" placeholder="Enter username" value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} />

        <label className="form-lbl">Password</label>
        <div style={{ position:'relative', marginBottom:'0.85rem' }}>
          <input className="form-inp" style={{ marginBottom:0, paddingRight:'4rem' }}
            type={show ? 'text' : 'password'} placeholder="Enter password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <button onClick={() => setShow(s => !s)}
            style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.82rem' }}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>

        <button className="auth-btn" onClick={login} disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={{ textAlign:'center', margin:'1rem 0 0.25rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>Guest Customer?</div>
        <button className="auth-guest-btn" onClick={() => router.push('/')}>Browse Menu &amp; Order</button>

        <div style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.75rem', color:'var(--text-muted)' }}>
          Default admin: <strong style={{ color:'var(--gold)' }}>admin</strong> / <strong style={{ color:'var(--gold)' }}>password</strong>
        </div>
      </div>
    </div>
  )
}
