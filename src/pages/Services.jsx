import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../components/SiteContext'
import { money, dur } from '../lib/time'

export default function Services() {
  const { categories, services } = useSite()
  const [cat, setCat] = useState('all')
  const groups = [
    ...categories.map(c => ({ ...c, items: services.filter(s => s.category_id === c.id) })),
    { id: 'none', name: 'Otros', items: services.filter(s => !s.category_id || !categories.some(c => c.id === s.category_id)) }
  ].filter(g => g.items.length && (cat === 'all' || g.id === cat))

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 1000 }}>
        <h1 className="h-heading">Servicios<br />y precios</h1>
        <p className="muted" style={{ margin: '16px 0 32px', maxWidth: 520 }}>Elige tu tratamiento y reserva directamente. Los precios marcados con «desde» pueden variar según el largo o la necesidad.</p>
        <div className="chips" style={{ marginBottom: 40 }}>
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>Todos</button>
          {categories.filter(c => services.some(s => s.category_id === c.id)).map(c =>
            <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.name}</button>)}
        </div>
        {groups.map(g => (
          <div key={g.id} className="menu-cat">
            <h2 className="h-sub">{g.name}</h2>
            {g.items.map(s => (
              <div key={s.id} className="svc">
                {s.image_url ? <img className="svc-img" src={s.image_url} alt={s.name} loading="lazy" /> : <div className="svc-img" />}
                <div>
                  <h3>{s.name}{s.featured && <span className="caption muted" style={{ marginLeft: 12, fontSize: 11 }}>Bestseller</span>}</h3>
                  {s.description && <p>{s.description}</p>}
                  <p>{dur(s.duration_min)}</p>
                </div>
                <div className="svc-meta">
                  <span className="svc-price">{s.price_from ? 'desde ' : ''}{money(s.price)}</span>
                  <Link className="ghost" to={`/reservar?servicio=${s.id}`}>Reservar</Link>
                </div>
              </div>
            ))}
          </div>
        ))}
        {!groups.length && <p className="muted">Pronto publicaremos nuestros servicios.</p>}
      </div>
    </section>
  )
}
