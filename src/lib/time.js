// Venezuela: UTC-4 fijo (sin horario de verano)
export const TZ = 'America/Caracas'
export const OFFSET = '-04:00'
const H = 3600000

export const ymdNow = () => new Date(Date.now() - 4 * H).toISOString().slice(0, 10)
export const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const weekday = (ymd) => new Date(ymd + 'T12:00:00Z').getUTCDay()
export const toISO = (ymd, hm) => new Date(`${ymd}T${hm.slice(0, 5)}:00${OFFSET}`).toISOString()
export const ymdOf = (iso) => new Date(new Date(iso).getTime() - 4 * H).toISOString().slice(0, 10)
const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m }
const toHM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
export const fmtTime = (iso) => new Intl.DateTimeFormat('es-VE', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))
export const fmtDateLong = (ymd) => cap(new Intl.DateTimeFormat('es-VE', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ymd + 'T12:00:00Z')))
export const fmtMonth = (ymd) => cap(new Intl.DateTimeFormat('es-VE', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(ymd + 'T12:00:00Z')).replace(' de ', ' '))
// Tasa USD → Bs (se fija desde SiteContext con la tasa del admin)
let RATE = 0
export const setRate = (r) => { RATE = Number(r) > 0 ? Number(r) : 0 }
export const usd = (n) => '$' + Number(n || 0).toFixed(2).replace(/\.00$/, '')
export const bs = (n) => 'Bs ' + new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0) * RATE)
/** Precio para mostrar: en dólares y, si hay tasa activa, también en bolívares */
export const money = (n) => RATE ? `${usd(n)} · ${bs(n)}` : usd(n)
export const dur = (m) => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`
export const WD = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
export const WD_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Estado de un día para el calendario: 'closed' | 'blocked' | 'past' | 'far' | 'open' */
export function dayState(ymd, hours, blocked, maxDays) {
  const today = ymdNow()
  if (ymd < today) return 'past'
  if (ymd > addDays(today, maxDays)) return 'far'
  if (blocked.some(b => b.day === ymd)) return 'blocked'
  const h = hours.find(x => x.weekday === weekday(ymd))
  if (!h || !h.is_open) return 'closed'
  return 'open'
}

/** Horas disponibles (ISO) para un servicio en un día */
export function freeSlots({ ymd, hours, duration, step = 30, busy = [], minNoticeH = 2 }) {
  const h = hours.find(x => x.weekday === weekday(ymd))
  if (!h || !h.is_open) return []
  const open = toMin(h.open_time), close = toMin(h.close_time)
  const earliest = Date.now() + minNoticeH * H
  const out = []
  for (let m = open; m + duration <= close; m += step) {
    const st = new Date(toISO(ymd, toHM(m))).getTime(), en = st + duration * 60000
    if (st < earliest) continue
    const clash = busy.some(b => new Date(b.starts_at).getTime() < en && new Date(b.ends_at).getTime() > st)
    if (!clash) out.push(new Date(st).toISOString())
  }
  return out
}
