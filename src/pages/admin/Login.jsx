import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'

export default function Login() {
  const { settings } = useSite()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await api.signIn(email, pass); nav('/admin') } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--mist)', padding: 24 }}>
      <form onSubmit={submit} className="stack" style={{ width: '100%', maxWidth: 380, background: 'var(--white)', padding: 32 }}>
        {settings?.logo_url
          ? <div style={{ background: 'var(--carbon)', margin: '-32px -32px 0', padding: 24 }}><img src={settings.logo_url} alt={settings.salon_name} style={{ width: 220, margin: '0 auto' }} /></div>
          : <h1 className="h-heading">{settings?.salon_name || 'Admin'}</h1>}
        <p className="caption muted">Panel de administración</p>
        <label className="f"><span>Correo</span><input className="in" type="email" value={email} onChange={e => setEmail(e.target.value)} required={!api.DEMO} autoComplete="username" /></label>
        <label className="f"><span>Contraseña</span><input className="in" type="password" value={pass} onChange={e => setPass(e.target.value)} required={!api.DEMO} autoComplete="current-password" /></label>
        {api.DEMO && <p className="note">Modo demo: entra con cualquier dato.</p>}
        {err && <div className="err">{err}</div>}
        <button className="btn-line solid" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <Link className="ghost" to="/">Volver al sitio</Link>
      </form>
    </div>
  )
}
