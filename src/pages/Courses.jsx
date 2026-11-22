import { useState } from 'react'
import { useSite } from '../components/SiteContext'
import { waLink } from '../components/SiteLayout'
import { money } from '../lib/time'

export const COURSE_STATUS = {
  proximamente: 'Próximamente',
  inscripciones: 'Inscripciones abiertas',
  agotado: 'Cupos agotados'
}

export default function Courses() {
  const { courses, settings: s } = useSite()
  const [zoom, setZoom] = useState(null)

  return (
    <section className="section">
      <div className="wrap">
        <h1 className="h-heading">Cursos</h1>
        <p className="muted" style={{ margin: '16px 0 40px', maxWidth: 560 }}>
          Formación profesional en cejas, pestañas y labios, con práctica guiada y acompañamiento personalizado.
        </p>
        {!courses.length && <p className="muted">Muy pronto anunciaremos nuestros próximos cursos.</p>}
        <div className="courses">
          {courses.map(c => {
            const wa = waLink(s.whatsapp, `Hola, quisiera información sobre el curso «${c.title}».`)
            return (
              <article key={c.id} className="course">
                <button className="course-ph" onClick={() => c.image_url && setZoom(c)} aria-label={`Ver afiche de ${c.title}`}>
                  {c.image_url ? <img src={c.image_url} alt={c.title} loading="lazy" /> : <span className="ph-empty">{c.title[0]}</span>}
                </button>
                <div className="stack" style={{ gap: 8 }}>
                  <span className={`course-st st-${c.status}`}>{COURSE_STATUS[c.status]}</span>
                  <h2 className="h-sub" style={{ margin: 0 }}>{c.title}</h2>
                  {c.subtitle && <p className="caption muted" style={{ margin: 0 }}>{c.subtitle}</p>}
                  {(c.start_text || c.price != null) && (
                    <div className="card-row" style={{ fontSize: 14 }}>
                      <span>{c.start_text || ''}</span>
                      {c.price != null && <span style={{ color: 'var(--ink)' }}>{money(c.price)}</span>}
                    </div>
                  )}
                  {c.description && <p style={{ fontSize: 14, margin: 0, whiteSpace: 'pre-line' }}>{c.description}</p>}
                  {c.includes && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Incluye: {c.includes}</p>}
                  {wa && c.status !== 'agotado' && (
                    <a className="ghost" style={{ alignSelf: 'flex-start', marginTop: 8 }} href={wa} target="_blank" rel="noreferrer">
                      {c.status === 'inscripciones' ? 'Inscribirme' : 'Quiero información'}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      {zoom && (
        <div className="modal-bg" onClick={() => setZoom(null)} style={{ alignItems: 'center' }}>
          <img src={zoom.image_url} alt={zoom.title} style={{ maxHeight: '88vh', maxWidth: '100%', width: 'auto' }} />
        </div>
      )}
    </section>
  )
}
