import * as api from '../../lib/api'
import { waLink } from '../../components/SiteLayout'
import { fmtTime, fmtDateLong, ymdOf, money } from '../../lib/time'

export const STATUS = { pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió' }

// Venezuela: 0412-1234567 → 584121234567; 4121234567 → 584121234567
const intl = (p) => { const d = String(p).replace(/\D/g, ''); if (d.startsWith('58') && d.length >= 12) return d; if (d.startsWith('0')) return '58' + d.slice(1); return d.length === 10 ? '58' + d : d }

export default function ApptTable({ rows, onChange, showDate = true, salonName }) {
  if (!rows.length) return <p className="muted">No hay citas en este rango.</p>
  const set = async (a, st) => { await api.setAppointmentStatus(a.id, st); onChange?.() }
  const confirmMsg = (a) => `Hola ${a.client_name.split(' ')[0]}, te confirmamos tu cita de ${a.service_name} el ${fmtDateLong(ymdOf(a.starts_at))} a las ${fmtTime(a.starts_at)} en ${salonName}. ¡Te esperamos!`
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{showDate && <th>Fecha</th>}<th>Hora</th><th>Cliente</th><th>Servicio</th><th>Precio</th><th>Estado</th><th /></tr></thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id} className={['cancelada', 'no_asistio'].includes(a.status) ? 'dim' : ''}>
              {showDate && <td >{fmtDateLong(ymdOf(a.starts_at))}</td>}
              <td>{fmtTime(a.starts_at)}–{fmtTime(a.ends_at)}</td>
              <td>
                <div style={{ color: 'var(--ink)' }}>{a.client_name}</div>
                <a className="muted" href={waLink(intl(a.client_phone))} target="_blank" rel="noreferrer">{a.client_phone}</a>
                {a.notes && <div className="muted" style={{ maxWidth: 260 }} title={a.notes}>“{a.notes}”</div>}
              </td>
              <td>{a.service_name}</td>
              <td>{money(a.price)}</td>
              <td><span className={`badge ${a.status}`}>{STATUS[a.status]}</span></td>
              <td>
                <div className="row-actions">
                  {a.status === 'pendiente' && <>
                    <button className="ghost" onClick={() => { set(a, 'confirmada'); window.open(waLink(intl(a.client_phone), confirmMsg(a)), '_blank') }}>Confirmar</button>
                    <button className="ghost" onClick={() => set(a, 'cancelada')}>Rechazar</button>
                  </>}
                  {a.status === 'confirmada' && <>
                    <button className="ghost" onClick={() => set(a, 'completada')}>Completada</button>
                    <button className="ghost" onClick={() => set(a, 'no_asistio')}>No asistió</button>
                    <button className="ghost" onClick={() => set(a, 'cancelada')}>Cancelar</button>
                  </>}
                  {['cancelada', 'no_asistio', 'completada'].includes(a.status) &&
                    <select className="in" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={a.status} onChange={e => set(a, e.target.value)}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
