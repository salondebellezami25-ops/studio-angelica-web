// Temas de temporada (calendario de Venezuela). Se eligen en Admin → Ajustes del sitio.
export const THEMES = {
  none:         { name: 'Ninguno (estilo normal)' },
  navidad:      { name: 'Navidad', accent: '#7a1f2b', accent2: '#c9a24a', ink: '#ffffff', emoji: '✨', msg: '¡Feliz Navidad! Agenda tus citas de diciembre con tiempo.' },
  carnaval:     { name: 'Carnaval', accent: '#6a1b9a', accent2: '#f9a825', ink: '#ffffff', emoji: '🎭', msg: '¡Llegó el Carnaval! Luce espectacular estos días.' },
  amor:         { name: 'Día del Amor y la Amistad', accent: '#a8324f', accent2: '#f3c1cc', ink: '#ffffff', emoji: '💗', msg: 'Día del Amor y la Amistad: regálate (o regala) un momento para ti.' },
  semana_santa: { name: 'Semana Santa', accent: '#5b4b7a', accent2: '#d8cfe6', ink: '#ffffff', emoji: '🕊️', msg: 'Semana Santa: consulta nuestro horario especial.' },
  madres:       { name: 'Día de las Madres', accent: '#b0576e', accent2: '#f6d6de', ink: '#ffffff', emoji: '🌷', msg: 'Feliz Día de las Madres. Consiente a mamá con un servicio especial.' },
  padre:        { name: 'Día del Padre', accent: '#2f4858', accent2: '#c9d6df', ink: '#ffffff', emoji: '🎁', msg: 'Día del Padre: regalos y gift cards disponibles.' },
  independencia:{ name: '5 de Julio (Independencia)', accent: '#00247d', accent2: '#fce300', ink: '#ffffff', emoji: '🇻🇪', msg: '¡Feliz 5 de Julio, Venezuela!', stripe: 'linear-gradient(90deg,#fce300 0 33.3%,#00247d 33.3% 66.6%,#cf142b 66.6%)' },
  halloween:    { name: 'Halloween', accent: '#1f1f1f', accent2: '#ff8f00', ink: '#ffffff', emoji: '🎃', msg: 'Halloween: maquíllate de miedo… o de lujo.' },
  black_friday: { name: 'Black Friday', accent: '#000000', accent2: '#c9a24a', ink: '#ffffff', emoji: '🖤', msg: 'Black Friday: precios especiales por tiempo limitado.' }
}

const d = (y, m, day) => new Date(Date.UTC(y, m - 1, day))
const addD = (dt, n) => new Date(dt.getTime() + n * 86400000)

// Domingo de Pascua (algoritmo gregoriano anónimo)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1
  return d(y, month, day)
}
// n-ésimo domingo (o día de semana) de un mes
function nthWeekday(y, m, weekday, n) {
  const first = d(y, m, 1); const off = (weekday - first.getUTCDay() + 7) % 7
  return addD(first, off + 7 * (n - 1))
}

/** Rangos automáticos [desde, hasta] para un año, en orden de prioridad */
export function autoRanges(y) {
  const ea = easter(y), ashWed = addD(ea, -46)
  const thanks = nthWeekday(y, 11, 4, 4) // 4.º jueves de noviembre
  const madres = nthWeekday(y, 5, 0, 2), padre = nthWeekday(y, 6, 0, 3)
  return [
    ['navidad', d(y, 1, 1), d(y, 1, 6)],
    ['carnaval', addD(ashWed, -10), addD(ashWed, -1)],
    ['amor', d(y, 2, 7), d(y, 2, 14)],
    ['semana_santa', addD(ea, -7), ea],
    ['madres', addD(madres, -7), madres],
    ['padre', addD(padre, -7), padre],
    ['independencia', d(y, 7, 1), d(y, 7, 5)],
    ['black_friday', addD(thanks, -2), addD(thanks, 4)],
    ['navidad', d(y, 12, 1), d(y, 12, 31)]
  ]
}

/** Tema activo hoy según la configuración (hora de Venezuela, UTC-4) */
export function activeTheme(settings, now = new Date()) {
  const sel = settings?.theme || 'none'
  if (sel !== 'auto') return THEMES[sel] ? sel : 'none'
  const local = new Date(now.getTime() - 4 * 3600000)
  const today = d(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate())
  for (const [id, from, to] of autoRanges(today.getUTCFullYear())) if (today >= from && today <= to) return id
  return 'none'
}

export const fmtRange = (a, b) => {
  const f = (x) => new Intl.DateTimeFormat('es', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(x)
  return `${f(a)} – ${f(b)}`
}
