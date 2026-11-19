import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ApptTable from './ApptTable'
import { ymdNow, addDays, toISO, usd as money, fmtMonth, fmtDateLong } from '../../lib/time'

export default function Dashboard() {
  const { settings, reload } = useSite()
  const today = ymdNow()
  const monthStart = today.slice(0, 7) + '-01'
  const [d, setD] = useState(null)

  const load = async () => {
    const [y, m] = today.split('-').map(Number)
    const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
    const [month, todays, pending] = await Promise.all([
      api.listAppointments(toISO(monthStart, '00:00'), toISO(nextMonth, '00:00')),
      api.listAppointments(toISO(today, '00:00'), toISO(addDays(today, 1), '00:00')),
      api.listAppointments(new Date().toISOString(), toISO(addDays(today, 365), '00:00'))
    ])
    const valid = month.filter(a => !['cancelada', 'no_asistio'].includes(a.status))
    const phones = [...new Set(valid.map(a => a.client_phone))]
    const prev = await Promise.all(phones.map(p => api.countPhoneBefore(p, toISO(monthStart, '00:00'))))
    setD({
      citas: valid.length,
      ingresos: month.filter(a => a.status === 'completada').reduce((t, a) => t + Number(a.price || 0), 0),
      proyectado: valid.reduce((t, a) => t + Number(a.price || 0), 0),
      nuevas: prev.filter(n => n === 0).length,
      todays, pending: pending.filter(a => a.status === 'pendiente')
    })
  }
  useEffect(() => { load() }, []) // eslint-disable-line
  if (!d) return <p className="muted">Cargando…</p>

  return (
    <>
      <Head title="Resumen"><span className="caption muted" style={{ textTransform: 'uppercase' }}>{fmtMonth(today)}</span></Head>
      <RateCard settings={settings} reload={reload} />
      <div className="kpis">
        <div className="kpi"><span className="caption muted">Citas del mes</span><b>{d.citas}</b></div>
        <div className="kpi"><span className="caption muted">Ingresos cobrados</span><b>{money(d.ingresos)}</b></div>
        <div className="kpi"><span className="caption muted">Proyectado</span><b>{money(d.proyectado)}</b></div>
        <div className="kpi"><span className="caption muted">Clientas nuevas</span><b>{d.nuevas}</b></div>
      </div>

      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="h-sub">Por confirmar ({d.pending.length})</h2>
        <Link className="ghost" to="/admin/citas">Ver todas</Link>
      </div>
      <div style={{ marginBottom: 48 }}><ApptTable rows={d.pending} onChange={load} salonName={settings.salon_name} /></div>

      <h2 className="h-sub" style={{ marginBottom: 16 }}>Hoy · {fmtDateLong(today)}</h2>
      <ApptTable rows={d.todays} onChange={load} showDate={false} salonName={settings.salon_name} />
    </>
  )
}

function RateCard({ settings, reload }) {
  const [rate, setRateVal] = useState(settings.usd_ves_rate ?? '')
  const [show, setShow] = useState(!!settings.show_bs)
  const [msg, setMsg] = useState('')
  const upd = settings.rate_updated_at ? new Date(settings.rate_updated_at) : null
  const todayVE = new Date().toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })
  const stale = !upd || upd.toLocaleDateString('es-VE', { timeZone: 'America/Caracas' }) !== todayVE
  const save = async (e) => {
    e.preventDefault()
    const r = Number(String(rate).replace(/\./g, '').replace(',', '.'))
    if (show && !(r > 0)) return setMsg('Escribe una tasa válida, por ejemplo 365,50.')
    await api.saveSettings({ usd_ves_rate: r > 0 ? r : null, show_bs: show, rate_updated_at: new Date().toISOString() })
    await reload(); setMsg('Tasa guardada.'); setTimeout(() => setMsg(''), 2500)
  }
  return (
    <form className="panel rate-card" onSubmit={save} style={{ marginBottom: 32 }}>
      <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div>
          <p className="caption muted" style={{ margin: '0 0 8px' }}>Tasa del día (Bs por 1 USD)</p>
          <div className="toolbar">
            <input className="in" style={{ width: 180, background: 'var(--white)', fontSize: 20 }} inputMode="decimal" placeholder="365,50"
              value={rate} onChange={e => setRateVal(e.target.value)} />
            <label className="check"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />Mostrar precios en Bs en el sitio</label>
            <button className="btn-line solid">Guardar tasa</button>
          </div>
        </div>
        <div className="rate-upd" style={{ fontSize: 13, textAlign: 'right' }}>
          {upd ? <>Última actualización:<br /><span style={{ color: 'var(--ink)' }}>{upd.toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'medium', timeStyle: 'short' })}</span></> : 'Aún no hay tasa guardada.'}
          {show && stale && <div className="err" style={{ marginTop: 8 }}>La tasa no es de hoy. Actualízala.</div>}
        </div>
      </div>
      {msg && <p className="muted" style={{ margin: '12px 0 0' }}>{msg}</p>}
    </form>
  )
}
