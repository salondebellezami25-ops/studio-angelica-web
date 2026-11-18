import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import { WD_LONG, fmtDateLong, ymdNow } from '../../lib/time'

export default function Schedule() {
  const { settings, reload } = useSite()
  const [hours, setHours] = useState([])
  const [blocked, setBlocked] = useState([])
  const [cfg, setCfg] = useState({ slot_minutes: 30, min_notice_hours: 2, max_days_ahead: 60 })
  const [nb, setNb] = useState({ day: '', reason: '' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    const [h, b] = await Promise.all([api.getHours(), api.listBlocked()])
    setHours(h); setBlocked(b)
    setCfg({ slot_minutes: settings.slot_minutes, min_notice_hours: settings.min_notice_hours, max_days_ahead: settings.max_days_ahead })
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  const setH = (wd, k, v) => setHours(hours.map(h => h.weekday === wd ? { ...h, [k]: v } : h))
  const save = async () => {
    const bad = hours.find(h => h.is_open && h.open_time >= h.close_time)
    if (bad) return setMsg(`Revisa el horario del ${WD_LONG[bad.weekday]}: la apertura debe ser antes del cierre.`)
    await api.saveHours(hours.map(h => ({ ...h, open_time: h.open_time.slice(0, 5), close_time: h.close_time.slice(0, 5) })))
    await api.saveSettings({ slot_minutes: Number(cfg.slot_minutes), min_notice_hours: Number(cfg.min_notice_hours), max_days_ahead: Number(cfg.max_days_ahead) })
    await reload(); setMsg('Horario guardado.'); setTimeout(() => setMsg(''), 2500)
  }
  const addB = async (e) => { e.preventDefault(); if (!nb.day) return; await api.addBlocked(nb); setNb({ day: '', reason: '' }); await load(); reload() }
  const delB = async (day) => { await api.removeBlocked(day); await load(); reload() }

  return (
    <>
      <Head title="Horarios"><button className="btn-line solid" onClick={save}>Guardar cambios</button></Head>
      {msg && <div className="note" style={{ marginBottom: 24 }}>{msg}</div>}
      <div className="two wide-gap">
        <div>
          <h2 className="h-sub" style={{ marginBottom: 16 }}>Horario semanal</h2>
          <table className="tbl">
            <tbody>
              {[1, 2, 3, 4, 5, 6, 0].map(wd => {
                const h = hours.find(x => x.weekday === wd); if (!h) return null
                return (
                  <tr key={wd} className={h.is_open ? '' : 'dim'}>
                    <td><label className="check"><input type="checkbox" checked={h.is_open} onChange={e => setH(wd, 'is_open', e.target.checked)} />{WD_LONG[wd]}</label></td>
                    <td><input className="in" type="time" value={h.open_time.slice(0, 5)} onChange={e => setH(wd, 'open_time', e.target.value)} disabled={!h.is_open} /></td>
                    <td><input className="in" type="time" value={h.close_time.slice(0, 5)} onChange={e => setH(wd, 'close_time', e.target.value)} disabled={!h.is_open} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <h2 className="h-sub" style={{ margin: '40px 0 16px' }}>Reglas de agenda</h2>
          <div className="form-grid">
            <label className="f"><span>Intervalo entre horarios</span>
              <select className="in" value={cfg.slot_minutes} onChange={e => setCfg({ ...cfg, slot_minutes: e.target.value })}>
                {[15, 30, 45, 60].map(n => <option key={n} value={n}>Cada {n} min</option>)}
              </select>
            </label>
            <label className="f"><span>Anticipación mínima (horas)</span><input className="in" type="number" min="0" value={cfg.min_notice_hours} onChange={e => setCfg({ ...cfg, min_notice_hours: e.target.value })} /></label>
            <label className="f"><span>Reservas hasta (días adelante)</span><input className="in" type="number" min="1" value={cfg.max_days_ahead} onChange={e => setCfg({ ...cfg, max_days_ahead: e.target.value })} /></label>
          </div>
        </div>
        <div>
          <h2 className="h-sub" style={{ marginBottom: 16 }}>Días no laborables</h2>
          <p className="muted" style={{ marginBottom: 16 }}>Feriados, vacaciones o días cerrados. No aparecerán disponibles para reservar.</p>
          <form className="toolbar" onSubmit={addB} style={{ marginBottom: 24 }}>
            <input className="in" type="date" min={ymdNow()} style={{ width: 'auto' }} value={nb.day} onChange={e => setNb({ ...nb, day: e.target.value })} required />
            <input className="in" style={{ flex: 1, minWidth: 160 }} placeholder="Motivo (opcional)" value={nb.reason} onChange={e => setNb({ ...nb, reason: e.target.value })} />
            <button className="btn-line">Bloquear</button>
          </form>
          <table className="tbl">
            <tbody>
              {blocked.filter(b => b.day >= ymdNow()).map(b => (
                <tr key={b.day}><td >{fmtDateLong(b.day)}</td><td className="muted">{b.reason}</td><td><div className="row-actions"><button className="ghost" onClick={() => delB(b.day)}>Quitar</button></div></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
