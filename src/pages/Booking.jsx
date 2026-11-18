import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useSite } from '../components/SiteContext'
import { waLink } from '../components/SiteLayout'
import Calendar from '../components/Calendar'
import * as api from '../lib/api'
import { ymdNow, addDays, toISO, ymdOf, dayState, freeSlots, fmtTime, fmtDateLong, money, dur } from '../lib/time'

const STEPS = ['Servicios', 'Fecha y hora', 'Tus datos', 'Listo']

export default function Booking() {
  const { settings: s, categories, services, hours, blocked } = useSite()
  const [params] = useSearchParams()
  const initial = params.get('servicio')
  const [step, setStep] = useState(0)
  const [ids, setIds] = useState(initial && services.some(x => x.id === initial) ? [initial] : [])
  const [month, setMonth] = useState(ymdNow().slice(0, 7))
  const [day, setDay] = useState('')
  const [slot, setSlot] = useState('')
  const [busy, setBusy] = useState([])
  const [busyLoading, setBusyLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', accept: false })
  const [err, setErr] = useState('')
  const [sending, setSending] = useState(false)

  // Servicios elegidos (en el orden en que se marcaron) y totales
  const chosen = ids.map(id => services.find(x => x.id === id)).filter(Boolean)
  const totalDur = chosen.reduce((t, x) => t + Number(x.duration_min), 0)
  const totalPrice = chosen.reduce((t, x) => t + Number(x.price), 0)
  const anyFrom = chosen.some(x => x.price_from)
  const names = chosen.map(x => x.name).join(' + ')
  const toggle = (id) => { setIds(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]); setDay(''); setSlot('') }

  // Ocupación del mes visible
  const loadBusy = async () => {
    setBusyLoading(true)
    try {
      const from = toISO(month + '-01', '00:00')
      const to = toISO(addDays(month + '-01', 32), '00:00')
      setBusy(await api.busySlots(from, to))
    } catch (e) { setErr(e.message) } finally { setBusyLoading(false) }
  }
  useEffect(() => { if (step === 1) loadBusy() }, [month, step]) // eslint-disable-line

  const slotsFor = (ymd) => totalDur ? freeSlots({
    ymd, hours, duration: totalDur, step: s.slot_minutes || 30,
    busy: busy.filter(b => ymdOf(b.starts_at) === ymd), minNoticeH: s.min_notice_hours ?? 2
  }) : []
  const stateOf = (ymd) => {
    const st = dayState(ymd, hours, blocked, s.max_days_ahead || 60)
    if (st !== 'open') return st
    return slotsFor(ymd).length ? 'open' : 'full'
  }
  const daySlots = useMemo(() => day ? slotsFor(day) : [], [day, busy, totalDur]) // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (form.name.trim().length < 2) return setErr('Escribe tu nombre.')
    if (form.phone.replace(/\D/g, '').length < 7) return setErr('Escribe un número de WhatsApp válido.')
    if (!form.accept) return setErr('Debes aceptar las políticas de la cita.')
    setSending(true)
    try {
      await api.book({ service_ids: ids, starts_at: slot, name: form.name, phone: form.phone, email: form.email, notes: form.notes })
      setStep(3)
    } catch (e2) {
      setErr(e2.message)
      if (/ocup/i.test(e2.message)) { setSlot(''); setStep(1); loadBusy() }
    } finally { setSending(false) }
  }

  const msg = chosen.length && slot ? `Hola, soy ${form.name}. Acabo de solicitar una cita de ${names} para el ${fmtDateLong(day)} a las ${fmtTime(slot)}.` : ''
  const priceTxt = `${anyFrom ? 'desde ' : ''}${money(totalPrice)}`

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 1000 }}>
        <h1 className="h-heading" style={{ marginBottom: 32 }}>Reserva<br />tu cita</h1>
        <div className="steps">{STEPS.map((t, i) => <span key={t} className={i === step ? 'on' : i < step ? 'done' : ''}>{String(i + 1).padStart(2, '0')} {t}</span>)}</div>
        {err && step !== 2 && <div className="err" style={{ marginBottom: 24 }}>{err}</div>}

        {step === 0 && (
          <div>
            <p className="muted" style={{ marginBottom: 24 }}>Puedes elegir uno o varios servicios para la misma cita.</p>
            {categories.concat([{ id: null, name: 'Otros' }]).map(c => {
              const items = services.filter(x => c.id ? x.category_id === c.id : !categories.some(k => k.id === x.category_id))
              if (!items.length) return null
              return (
                <div key={c.id || 'none'} style={{ marginBottom: 32 }}>
                  <p className="caption muted" style={{ marginBottom: 12 }}>{c.name}</p>
                  {items.map(x => {
                    const on = ids.includes(x.id)
                    return (
                      <button key={x.id} className={`pick ${on ? 'on' : ''}`} onClick={() => toggle(x.id)} aria-pressed={on}>
                        <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                          <span className="tick" aria-hidden="true">{on ? '✓' : ''}</span>
                          <span><span style={{ color: 'var(--ink)' }}>{x.name}</span><br /><span className="muted" style={{ fontSize: 13 }}>{dur(x.duration_min)}</span></span>
                        </span>
                        <span>{x.price_from ? 'desde ' : ''}{money(x.price)}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
            {chosen.length > 0 && (
              <div className="pick-bar">
                <div>
                  <div className="caption" style={{ color: 'var(--pale-slate)' }}>{chosen.length} {chosen.length === 1 ? 'servicio' : 'servicios'} · {dur(totalDur)}</div>
                  <div style={{ fontSize: 16 }}>{priceTxt}</div>
                </div>
                <button className="btn-line solid" style={{ borderColor: 'var(--white)' }} onClick={() => setStep(1)}>Continuar</button>
              </div>
            )}
          </div>
        )}

        {step === 1 && chosen.length > 0 && (
          <div className="two wide-gap">
            <div>
              <div className="note" style={{ marginBottom: 24 }}>
                <span className="caption muted">{chosen.length === 1 ? 'Servicio' : 'Servicios'}</span><br />
                <span style={{ color: 'var(--ink)' }}>{names}</span><br />
                {dur(totalDur)} · {priceTxt}{' '}
                <button className="ghost" style={{ marginLeft: 8 }} onClick={() => setStep(0)}>Cambiar</button>
              </div>
              <Calendar month={month} onMonth={(m) => { setMonth(m); setDay(''); setSlot('') }} selected={day}
                onSelect={(d) => { setDay(d); setSlot('') }} stateOf={stateOf} minMonth={ymdNow().slice(0, 7)} />
            </div>
            <div>
              {!day && <p className="muted">{busyLoading ? 'Consultando disponibilidad…' : 'Selecciona un día disponible en el calendario.'}</p>}
              {day && (
                <>
                  <h3 className="h-sub" style={{ marginBottom: 24 }}>{fmtDateLong(day)}</h3>
                  {daySlots.length
                    ? <div className="slots">{daySlots.map(t => <button key={t} className={`slot ${slot === t ? 'on' : ''}`} onClick={() => setSlot(t)}>{fmtTime(t)}</button>)}</div>
                    : <p className="muted">No quedan horarios este día para {dur(totalDur)}.</p>}
                  <div style={{ marginTop: 32 }}><button className="btn-line solid" disabled={!slot} onClick={() => setStep(2)}>Continuar</button></div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && chosen.length > 0 && (
          <div className="two wide-gap">
            <form onSubmit={submit} className="stack">
              <label className="f"><span>Nombre completo *</span><input className="in" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
              <label className="f"><span>WhatsApp *</span><input className="in" type="tel" placeholder="6000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></label>
              <label className="f"><span>Correo (opcional)</span><input className="in" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
              <label className="f"><span>¿Algo que debamos saber?</span><textarea className="in" placeholder="Alergias, condición de la piel, referencia del diseño…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
              <label className="check"><input type="checkbox" checked={form.accept} onChange={e => setForm({ ...form, accept: e.target.checked })} />Leí y acepto las <Link to="/#politicas" target="_blank">políticas de la cita</Link>.</label>
              {err && <div className="err">{err}</div>}
              <div className="toolbar" style={{ gap: 24 }}>
                <button className="btn-line solid" disabled={sending}>{sending ? 'Enviando…' : 'Solicitar cita'}</button>
                <button type="button" className="ghost" onClick={() => setStep(1)}>Volver</button>
              </div>
            </form>
            <Summary chosen={chosen} day={day} slot={slot} totalDur={totalDur} priceTxt={priceTxt} />
          </div>
        )}

        {step === 3 && chosen.length > 0 && (
          <div className="two wide-gap">
            <div className="stack">
              <h2 className="h-heading">Gracias,<br />{form.name.split(' ')[0]}.</h2>
              <p style={{ fontSize: 16, maxWidth: 460 }}>Recibimos tu solicitud. Tu cita queda <b style={{ fontWeight: 400, textDecoration: 'underline' }}>pendiente</b> hasta que te escribamos por WhatsApp para confirmarla.</p>
              <div className="toolbar" style={{ gap: 32 }}>
                {s.whatsapp && <a className="btn-line solid" href={waLink(s.whatsapp, msg)} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>}
                <Link className="ghost" to="/">Volver al inicio</Link>
              </div>
            </div>
            <Summary chosen={chosen} day={day} slot={slot} totalDur={totalDur} priceTxt={priceTxt} />
          </div>
        )}
      </div>
    </section>
  )
}

function Summary({ chosen, day, slot, totalDur, priceTxt }) {
  return (
    <aside className="summary">
      <p className="caption muted">Resumen</p>
      <dl>
        <dt>{chosen.length === 1 ? 'Servicio' : 'Servicios'}</dt>
        <dd>{chosen.map(x => <div key={x.id}>{x.name} <span className="muted" style={{ fontSize: 13 }}>· {x.price_from ? 'desde ' : ''}{money(x.price)}</span></div>)}</dd>
        <dt>Fecha</dt><dd>{fmtDateLong(day)}</dd>
        <dt>Hora</dt><dd>{fmtTime(slot)}</dd>
        <dt>Duración</dt><dd>{dur(totalDur)}</dd>
        <dt>Total</dt><dd>{priceTxt}</dd>
      </dl>
    </aside>
  )
}
