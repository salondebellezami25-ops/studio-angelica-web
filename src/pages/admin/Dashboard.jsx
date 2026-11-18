import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ApptTable from './ApptTable'
import { ymdNow, addDays, toISO, money, fmtMonth, fmtDateLong } from '../../lib/time'

export default function Dashboard() {
  const { settings } = useSite()
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
