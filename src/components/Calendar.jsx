import { WD, fmtMonth, addDays, ymdNow } from '../lib/time'

/** stateOf(ymd) -> 'open' | 'closed' | 'blocked' | 'past' | 'far' | 'full' */
export default function Calendar({ month, onMonth, selected, onSelect, stateOf, minMonth }) {
  const first = month + '-01'
  const startWd = new Date(first + 'T12:00:00Z').getUTCDay()
  const [y, m] = month.split('-').map(Number)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = Array(startWd).fill(null).concat(Array.from({ length: days }, (_, i) => addDays(first, i)))
  const shift = (n) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); onMonth(d.toISOString().slice(0, 7)) }
  const canPrev = !minMonth || month > minMonth

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="ghost" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mes anterior">Ant.</button>
        <h3>{fmtMonth(first)}</h3>
        <button className="ghost" onClick={() => shift(1)} aria-label="Mes siguiente">Sig.</button>
      </div>
      <div className="cal-grid">
        {WD.map((d, i) => <div key={i} className="wd">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const st = stateOf(d)
          const clickable = st === 'open'
          return (
            <button key={d} className={`day ${st} ${selected === d ? 'sel' : ''}`} disabled={!clickable}
              onClick={() => clickable && onSelect(d)} aria-label={d}
              style={d === ymdNow() ? { borderColor: 'var(--pale-slate)' } : undefined}>
              {Number(d.slice(8))}
            </button>
          )
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--white)', borderColor: 'var(--slate)' }} />Disponible</span>
        <span><i style={{ background: 'var(--soft-mist)' }} />Sin cupos</span>
        <span><i style={{ borderColor: 'var(--pale-slate)' }} />No laborable</span>
      </div>
    </div>
  )
}
