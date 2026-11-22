import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'

export default function AdminLayout() {
  const [session, setSession] = useState(undefined)
  const { settings } = useSite()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  useEffect(() => {
    api.getSession().then(setSession)
    return api.onAuthChange(setSession)
  }, [])
  // App instalable: dentro del admin, el ícono abre directo el panel
  useEffect(() => {
    const l = document.querySelector('link[rel=manifest]'); if (!l) return
    const prev = l.getAttribute('href'); l.setAttribute('href', '/manifest-admin.webmanifest')
    try { if (navigator.standalone || matchMedia('(display-mode: standalone)').matches) localStorage.setItem('sa_admin_device', '1') } catch (e) {}
    return () => l.setAttribute('href', prev)
  }, [])
  if (session === undefined) return <div className="wrap section caption muted">Cargando…</div>
  if (!session) return <Navigate to="/admin/login" replace />

  return (
    <div className="admin">
      <header className="adm-top">
        <Link to="/admin" className="brand">{settings?.salon_name || 'Admin'}</Link>
        <button className="adm-menu-btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Menú">
          <span className={'adm-burger' + (open ? ' x' : '')}><i /><i /></span>{open ? 'Cerrar' : 'Menú'}
        </button>
      </header>
      <aside className={'side' + (open ? ' open' : '')}>
        <div className="brand">{settings?.salon_name || 'Admin'}</div>
        <NavLink end to="/admin">Resumen</NavLink>
        <NavLink to="/admin/citas">Citas</NavLink>
        <NavLink to="/admin/servicios">Servicios y precios</NavLink>
        <NavLink to="/admin/cursos">Cursos</NavLink>
        <NavLink to="/admin/galeria">Fotos</NavLink>
        <NavLink to="/admin/pagos">Métodos de pago</NavLink>
        <NavLink to="/admin/horarios">Horarios</NavLink>
        <NavLink to="/admin/ajustes">Ajustes del sitio</NavLink>
        <div className="bottom">
          <a href="/?sitio=1" target="_blank" rel="noopener" className="ghost light">Ver sitio</a>
          <Link to="/admin/clave" className="ghost light">Cambiar contraseña</Link>
          <button className="ghost light" style={{ textAlign: 'left' }} onClick={async () => { await api.signOut(); nav('/admin/login') }}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">
        {api.DEMO && <div className="note" style={{ marginBottom: 24 }}>Modo demo: los cambios se guardan solo en este navegador. Conecta Supabase con el archivo <code>.env.local</code> para usarlo de verdad. <button className="ghost" onClick={() => { if (confirm('¿Restaurar los datos de ejemplo?')) { api.resetDemo(); location.reload() } }}>Restaurar demo</button></div>}
        <Outlet />
      </main>
    </div>
  )
}

export function Head({ title, children }) {
  return <div className="main-head"><h1 className="h-heading">{title}</h1><div className="toolbar">{children}</div></div>
}
