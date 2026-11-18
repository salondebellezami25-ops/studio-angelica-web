import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSite } from './SiteContext'
import { DEMO } from '../lib/api'

export function Logo({ settings, className = 'nav-logo' }) {
  const name = settings?.salon_name || ''
  return (
    <Link to="/" className={className} aria-label={name}>
      {name}
    </Link>
  )
}

export const waLink = (num, text = '') => num ? `https://wa.me/${String(num).replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}` : null

export default function SiteLayout() {
  const { settings, loading, error } = useSite()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname, loc.hash])
  useEffect(() => {
    if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80)
    else window.scrollTo(0, 0)
  }, [loc.pathname, loc.hash])

  if (loading) return <div className="wrap section muted caption">Cargando…</div>
  if (error) return <div className="wrap section"><div className="err">No se pudo cargar el sitio: {error}</div></div>
  const s = settings
  const wa = waLink(s.whatsapp, `Hola, quisiera información sobre sus servicios.`)

  return (
    <>
      {DEMO && <div className="demo-bar">MODO DEMO · los datos se guardan solo en este navegador · <Link to="/admin">Ir al admin</Link></div>}
      <header className="nav">
        <div className="nav-in">
          <nav className={`nav-links left ${open ? 'open' : ''}`}>
            <NavLink to="/servicios">Servicios</NavLink>
            <Link to="/#galeria">Galería</Link>
            <Link to="/#politicas">Políticas</Link>
            <Link to="/#ubicacion">Ubicación</Link>
          </nav>
          <Logo settings={s} />
          <nav className="nav-links nav-right">
            {s.instagram && <a className="hide-m" href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer">Instagram</a>}
            {wa && <a className="hide-m" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
            <NavLink to="/reservar">Reservar</NavLink>
            <button className="burger" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? 'Cerrar' : 'Menú'}</button>
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="brand">{s.salon_name}</div>
              {s.tagline && <p style={{ maxWidth: 420 }}>{s.tagline}</p>}
            </div>
            <div>
              <h4>Visítanos</h4>
              {s.address && <p style={{ margin: '0 0 8px' }}>{s.address}</p>}
              {s.phone && <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>}
            </div>
            <div>
              <h4>Síguenos</h4>
              {s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer">@{s.instagram}</a>}
              {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
              <Link to="/reservar">Reservar cita</Link>
            </div>
          </div>
          <p className="caption" style={{ marginTop: 24, color: 'var(--pale-slate)' }}>© {new Date().getFullYear()} {s.salon_name}</p>
        </div>
      </footer>
    </>
  )
}
