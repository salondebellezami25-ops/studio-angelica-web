import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, Link, useNavigate } from 'react-router-dom'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'

export default function AdminLayout() {
  const [session, setSession] = useState(undefined)
  const { settings } = useSite()
  const nav = useNavigate()
  useEffect(() => {
    api.getSession().then(setSession)
    return api.onAuthChange(setSession)
  }, [])
  if (session === undefined) return <div className="wrap section caption muted">Cargando…</div>
  if (!session) return <Navigate to="/admin/login" replace />

  return (
    <div className="admin">
      <aside className="side">
        <div className="brand">{settings?.salon_name || 'Admin'}</div>
        <NavLink end to="/admin">Resumen</NavLink>
        <NavLink to="/admin/citas">Citas</NavLink>
        <NavLink to="/admin/servicios">Servicios y precios</NavLink>
        <NavLink to="/admin/galeria">Fotos</NavLink>
        <NavLink to="/admin/horarios">Horarios</NavLink>
        <NavLink to="/admin/ajustes">Ajustes del sitio</NavLink>
        <div className="bottom">
          <Link to="/" target="_blank" className="ghost light">Ver sitio</Link>
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
