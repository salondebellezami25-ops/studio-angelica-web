import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ApptTable, { STATUS } from './ApptTable'
import { ymdNow, addDays, toISO, fmtDateLong, money } from '../../lib/time'

export default function Appointments() {
  const { settings, services } = useSite()
  const [from, setFrom] = useState(ymdNow())
  const [days, setDays] = useState(7)
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState([])
  const [showNew, setShowNew] = useState(false)

  const load = async () => setRows(await api.listAppointments(toISO(from, '00:00'), toISO(addDays(from, days), '00:00')))
  useEffect(() => { load() }, [from, days]) // eslint-disable-line
  const shown = status ? rows.filter(r => r.status === status) : rows

  return (
    <>
      <Head title="Citas"><button className="btn-line solid" onClick={() => setShowNew(true)}>Nueva cita</button></Head>
      <div className="toolbar" style={{ marginBottom: 24 }}>
        <button className="ghost" onClick={() => setFrom(addDays(from, -days))}>Anterior</button>
        <input className="in" type="date" style={{ width: 'auto' }} value={from} onChange={e => e.target.value && setFrom(e.target.value)} />
        <button className="ghost" onClick={() => setFrom(addDays(from, days))}>Siguiente</button>
        <select className="in" style={{ width: 'auto' }} value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={1}>Día</option><option value={7}>Semana</option><option value={30}>30 días</option>
        </select>
        <select className="in" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="ghost" onClick={() => setFrom(ymdNow())}>Hoy</button>
      </div>
      <ApptTable rows={shown} onChange={load} salonName={settings.salon_name} />
      {showNew && <NewAppt services={services} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load() }} />}
    </>
  )
}

function NewAppt({ services, onClose, onDone }) {
  const [f, setF] = useState({ service_id: services[0]?.id || '', day: ymdNow(), time: '10:00', name: '', phone: '', notes: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api.book({ service_id: f.service_id, starts_at: toISO(f.day, f.time), name: f.name, phone: f.phone, notes: f.notes })
      onDone()
    } catch (e2) { setErr(e2.message) }
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal stack" onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2 className="h-sub">Nueva cita</h2>
        <p className="muted">Para citas tomadas por WhatsApp o en el local. Queda como pendiente; confírmala en la lista.</p>
        <div className="form-grid">
          <label className="f full"><span>Servicio</span>
            <select className="in" value={f.service_id} onChange={set('service_id')}>{services.map(s => <option key={s.id} value={s.id}>{s.name} · {money(s.price)}</option>)}</select>
          </label>
          <label className="f"><span>Fecha</span><input className="in" type="date" value={f.day} onChange={set('day')} required /></label>
          <label className="f"><span>Hora</span><input className="in" type="time" value={f.time} onChange={set('time')} required /></label>
          <label className="f"><span>Cliente</span><input className="in" value={f.name} onChange={set('name')} required /></label>
          <label className="f"><span>WhatsApp</span><input className="in" value={f.phone} onChange={set('phone')} required /></label>
          <label className="f full"><span>Notas</span><textarea className="in" value={f.notes} onChange={set('notes')} /></label>
        </div>
        <p className="muted" >{f.day && fmtDateLong(f.day)}</p>
        {err && <div className="err">{err}</div>}
        <div className="toolbar"><button className="btn-line solid">Guardar</button><button type="button" className="ghost" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  )
}
