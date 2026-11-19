import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'

/** Crear contraseña (desde el correo de invitación / recuperación) o cambiarla estando dentro del admin */
export default function SetPassword({ fromLink = false }) {
  const { settings } = useSite()
  const [session, setSession] = useState(undefined)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getSession().then(s => setSession(s || (fromLink ? undefined : null)))
    const off = api.onAuthChange(s => setSession(s))
    // si el enlace no trae sesión válida, a los 4 s mostramos el aviso
    const t = setTimeout(() => setSession(s => (s === undefined ? null : s)), 4000)
    return () => { off(); clearTimeout(t) }
  }, [fromLink])

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (p1.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.')
    if (p1 !== p2) return setErr('Las contraseñas no coinciden.')
    setBusy(true)
    try { await api.setPassword(p1); window.location.replace('/admin') }
    catch (e2) { setErr(e2.message); setBusy(false) }
  }

  const box = (children) => (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--mist)', padding: 24 }}>
      <div className="stack" style={{ width: '100%', maxWidth: 380, background: 'var(--white)', padding: 32 }}>
        {settings?.logo_url
          ? <div style={{ background: 'var(--carbon)', margin: '-32px -32px 0', padding: 24 }}><img src={settings.logo_url} alt={settings.salon_name} style={{ width: 220, margin: '0 auto' }} /></div>
          : <h1 className="h-heading">{settings?.salon_name || 'Admin'}</h1>}
        {children}
      </div>
    </div>
  )

  if (api.AUTH_LINK === 'error') return box(<>
    <p className="caption muted">Enlace no válido</p>
    <div className="err">{api.AUTH_LINK_ERROR || 'El enlace venció o ya fue usado.'} Pide uno nuevo desde «¿Olvidaste tu contraseña?».</div>
    <a className="btn-line solid" href="/admin/login">Ir al inicio de sesión</a>
  </>)
  if (session === undefined) return box(<p className="caption muted">Cargando…</p>)
  if (!session) return box(<>
    <p className="caption muted">Sesión no encontrada</p>
    <p className="muted">{fromLink ? 'El enlace venció o ya fue usado.' : 'Inicia sesión para cambiar tu contraseña.'}</p>
    <a className="btn-line solid" href="/admin/login">Ir al inicio de sesión</a>
  </>)

  return box(
    <form onSubmit={submit} className="stack">
      <p className="caption muted">{fromLink ? 'Crea tu contraseña' : 'Cambiar contraseña'}</p>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{session.user?.email}</p>
      <label className="f"><span>Nueva contraseña</span><input className="in" type="password" value={p1} onChange={e => setP1(e.target.value)} autoComplete="new-password" required /></label>
      <label className="f"><span>Repite la contraseña</span><input className="in" type="password" value={p2} onChange={e => setP2(e.target.value)} autoComplete="new-password" required /></label>
      {err && <div className="err">{err}</div>}
      <button className="btn-line solid" disabled={busy}>{busy ? 'Guardando…' : 'Guardar y entrar'}</button>
      {!fromLink && <Link className="ghost" to="/admin">Volver al panel</Link>}
    </form>
  )
}
