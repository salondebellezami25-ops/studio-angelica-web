import { Link } from 'react-router-dom'
import { useSite } from '../components/SiteContext'
import { waLink } from '../components/SiteLayout'
import PaymentMethods from '../components/PaymentMethods'
import { money, dur, WD_LONG } from '../lib/time'

const fmtH = (t) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'p. m.' : 'a. m.'; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}` }

export function ServiceCard({ s }) {
  return (
    <article className="card">
      {s.featured && <span className="tag">Bestseller</span>}
      <div className="ph">{s.image_url ? <img src={s.image_url} alt={s.name} loading="lazy" /> : <span className="ph-empty">{s.name[0]}</span>}</div>
      <div>
        <div className="card-row"><span style={{ color: 'var(--ink)' }}>{s.name}</span><span>{s.price_from ? 'desde ' : ''}{money(s.price)}</span></div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{dur(s.duration_min)}</div>
      </div>
      <Link className="ghost" style={{ alignSelf: 'flex-start' }} to={`/reservar?servicio=${s.id}`}>Reservar</Link>
    </article>
  )
}

export default function Home() {
  const { settings: s, services, gallery, hours } = useSite()
  const featured = [...services].sort((a, b) => (b.featured - a.featured)).slice(0, 4)
  const hasPhoto = !!s.hero_url
  const dark = !!s.logo_url
  const steps = [
    ['Elige tu experiencia', 'Explora el catálogo y selecciona el tratamiento que mejor se adapte a ti.'],
    ['Escoge fecha y hora', 'El calendario te muestra solo los espacios disponibles.'],
    ['Envía tu solicitud', 'Déjanos tu nombre y WhatsApp. Tu cita queda pendiente.'],
    ['Te confirmamos', 'Te escribimos para confirmar los detalles. ¡Te esperamos!']
  ]

  return (
    <>
      {hasPhoto ? (
        <section className="hero-cover">
          <div className="cover-media">
            <img src={s.hero_url} alt="" />
            <div className="cover-veil" />
            <div className="cover-in">
              {s.logo_url
                ? <h1 className="cover-logo"><img src={s.logo_url} alt={s.salon_name} /></h1>
                : <h1 className="display" style={{ color: 'var(--white)' }}>{s.salon_name}</h1>}
              <div className="cover-text only-d">
                <h2 className="h-sub">{s.tagline}</h2>
                <div className="toolbar" style={{ gap: 32 }}>
                  <Link className="ghost light" to="/reservar">Reservar cita</Link>
                  <Link className="ghost light" to="/servicios">Ver servicios</Link>
                  <Link className="ghost light" to="/cursos">Ver cursos</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="cover-band only-m">
            <h2 className="h-sub">{s.tagline}</h2>
            <div className="toolbar" style={{ gap: 28 }}>
              <Link className="ghost light" to="/reservar">Reservar cita</Link>
              <Link className="ghost light" to="/servicios">Ver servicios</Link>
                  <Link className="ghost light" to="/cursos">Ver cursos</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className={`hero ${dark ? 'dark' : ''}`}>
          <div className="hero-in">
            {s.logo_url
              ? <h1 style={{ margin: 0 }}><img className="hero-logo" src={s.logo_url} alt={s.salon_name} /></h1>
              : <h1 className="display">{s.salon_name}</h1>}
            <div className="hero-foot">
              <h2 className="h-sub">{s.tagline}</h2>
              <p>Reserva en línea en menos de un minuto. Te confirmamos por WhatsApp.</p>
              <div className="toolbar" style={{ gap: 32 }}>
                <Link className={`ghost ${dark ? 'light' : ''}`} to="/reservar">Reservar cita</Link>
                <Link className={`ghost ${dark ? 'light' : ''}`} to="/servicios">Ver servicios</Link>
                <Link className={`ghost ${dark ? 'light' : ''}`} to="/cursos">Ver cursos</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <h2 className="h-heading">Nuestros<br />servicios</h2>
              <Link className="ghost" to="/servicios">Ver catálogo completo</Link>
            </div>
            <div className="cards cols-4">{featured.map(x => <ServiceCard key={x.id} s={x} />)}</div>
          </div>
        </section>
      )}

      <PaymentMethods />

      {s.promo_title && (s.promo_items?.length > 0) && (
        <section className="section band">
          <div className="wrap two wide-gap" style={{ alignItems: 'center' }}>
            <h2 className="h-heading">{s.promo_title}</h2>
            <div>
              <p className="caption muted">Al agendar tu cita disfruta de</p>
              <ul className="policies" style={{ marginTop: 16 }}>{s.promo_items.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          </div>
        </section>
      )}

      {s.about && (
        <section className="section">
          <div className="wrap two wide-gap">
            <h2 className="h-heading">Sobre<br />nosotros</h2>
            <p style={{ fontSize: 16, maxWidth: 560, whiteSpace: 'pre-line' }}>{s.about}</p>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="section band" id="galeria">
          <div className="wrap">
            <h2 className="h-heading center" style={{ marginBottom: 40 }}>Galería</h2>
            <div className="gallery">
              {gallery.map(g => <figure key={g.id}><img src={g.image_url} alt={g.caption || ''} loading="lazy" />{g.caption && <figcaption>{g.caption}</figcaption>}</figure>)}
            </div>
          </div>
        </section>
      )}

      <section className="section" id="politicas">
        <div className="wrap two wide-gap">
          <div>
            <h2 className="h-heading">Guía de<br />reservas</h2>
            <ol className="policies" style={{ marginTop: 32 }}>
              {steps.map(([t, d]) => <li key={t}><div><div style={{ color: 'var(--ink)' }}>{t}</div><div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{d}</div></div></li>)}
            </ol>
          </div>
          {s.policies?.length > 0 && (
            <div>
              <h2 className="h-heading">Para tu<br />cita</h2>
              <ul className="policies" style={{ marginTop: 32 }}>{s.policies.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      <section className="section band" id="ubicacion">
        <div className="wrap two wide-gap">
          <div className="stack">
            <h2 className="h-heading">Ubicación</h2>
            {s.address && <p style={{ fontSize: 16 }}>{s.address}</p>}
            <table className="tbl" style={{ maxWidth: 420 }}>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map(d => {
                  const h = hours.find(x => x.weekday === d)
                  return <tr key={d}><td>{WD_LONG[d]}</td><td style={{ textAlign: 'right' }}>{h?.is_open ? `${fmtH(h.open_time)} – ${fmtH(h.close_time)}` : 'Cerrado'}</td></tr>
                })}
              </tbody>
            </table>
            <div className="toolbar" style={{ gap: 32 }}>
              {s.maps_query && <a className="ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.maps_query)}`} target="_blank" rel="noreferrer">Cómo llegar</a>}
              {s.whatsapp && <a className="ghost" href={waLink(s.whatsapp)} target="_blank" rel="noreferrer">Escríbenos</a>}
            </div>
          </div>
          {s.maps_query && <iframe className="map" title="Mapa" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(s.maps_query)}&output=embed`} />}
        </div>
      </section>
    </>
  )
}
