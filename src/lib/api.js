// Capa de datos: usa Supabase si hay variables de entorno; si no, modo DEMO en localStorage.
import { createClient } from '@supabase/supabase-js'
import { demoSeed } from './demoSeed'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const DEMO = !URL || !KEY
export const sb = DEMO ? null : createClient(URL, KEY)

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))
const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name || '').localeCompare(b.name || '')

// ---------------- DEMO store ----------------
const LS = 'salon_demo_v2'
function db() {
  let d = null
  try { d = JSON.parse(localStorage.getItem(LS)) } catch { /* ignore */ }
  if (!d) { d = demoSeed(); save(d) }
  return d
}
function save(d) { try { localStorage.setItem(LS, JSON.stringify(d)) } catch { /* ignore */ } }
function mutate(fn) { const d = db(); const r = fn(d); save(d); return r }
const ok = (v) => Promise.resolve(structuredClone(v))
const unwrap = ({ data, error }) => { if (error) throw new Error(error.message); return data }

// ---------------- Settings ----------------
export async function getSettings() {
  if (DEMO) return ok(db().settings)
  return unwrap(await sb.from('settings').select('*').eq('id', 1).single())
}
export async function saveSettings(patch) {
  if (DEMO) return ok(mutate(d => Object.assign(d.settings, patch)))
  return unwrap(await sb.from('settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1).select().single())
}

// ---------------- Categories ----------------
export async function listCategories() {
  if (DEMO) return ok([...db().categories].sort(bySort))
  return unwrap(await sb.from('categories').select('*').order('sort_order').order('name'))
}
export async function saveCategory(c) {
  if (DEMO) return ok(mutate(d => {
    if (c.id) { Object.assign(d.categories.find(x => x.id === c.id), c); return c }
    const n = { ...c, id: uid() }; d.categories.push(n); return n
  }))
  const q = c.id ? sb.from('categories').update(c).eq('id', c.id) : sb.from('categories').insert(c)
  return unwrap(await q.select().single())
}
export async function deleteCategory(id) {
  if (DEMO) return ok(mutate(d => {
    d.categories = d.categories.filter(x => x.id !== id)
    d.services.forEach(s => { if (s.category_id === id) s.category_id = null })
  }))
  unwrap(await sb.from('categories').delete().eq('id', id))
}

// ---------------- Services ----------------
export async function listServices({ all = false } = {}) {
  if (DEMO) return ok(db().services.filter(s => all || s.active).sort(bySort))
  let q = sb.from('services').select('*').order('sort_order').order('name')
  if (!all) q = q.eq('active', true)
  return unwrap(await q)
}
export async function saveService(s) {
  const clean = { ...s, price: Number(s.price) || 0, duration_min: Number(s.duration_min) || 30, sort_order: Number(s.sort_order) || 0 }
  if (!clean.category_id) clean.category_id = null
  if (DEMO) return ok(mutate(d => {
    if (clean.id) { Object.assign(d.services.find(x => x.id === clean.id), clean); return clean }
    const n = { ...clean, id: uid() }; d.services.push(n); return n
  }))
  const { id, created_at, ...rest } = clean
  const q = id ? sb.from('services').update(rest).eq('id', id) : sb.from('services').insert(rest)
  return unwrap(await q.select().single())
}
export async function deleteService(id) {
  if (DEMO) return ok(mutate(d => { d.services = d.services.filter(x => x.id !== id) }))
  unwrap(await sb.from('services').delete().eq('id', id))
}

// ---------------- Gallery ----------------
export async function listGallery() {
  if (DEMO) return ok([...db().gallery].sort(bySort))
  return unwrap(await sb.from('gallery').select('*').order('sort_order').order('created_at', { ascending: false }))
}
export async function addGallery(item) {
  if (DEMO) return ok(mutate(d => { const n = { ...item, id: uid() }; d.gallery.push(n); return n }))
  return unwrap(await sb.from('gallery').insert(item).select().single())
}
export async function updateGallery(item) {
  if (DEMO) return ok(mutate(d => Object.assign(d.gallery.find(x => x.id === item.id), item)))
  const { id, created_at, ...rest } = item
  return unwrap(await sb.from('gallery').update(rest).eq('id', id).select().single())
}
export async function deleteGallery(id) {
  if (DEMO) return ok(mutate(d => { d.gallery = d.gallery.filter(x => x.id !== id) }))
  unwrap(await sb.from('gallery').delete().eq('id', id))
}

// ---------------- Hours & blocked dates ----------------
export async function getHours() {
  if (DEMO) return ok([...db().hours].sort((a, b) => a.weekday - b.weekday))
  return unwrap(await sb.from('business_hours').select('*').order('weekday'))
}
export async function saveHours(rows) {
  if (DEMO) return ok(mutate(d => { d.hours = rows }))
  return unwrap(await sb.from('business_hours').upsert(rows).select())
}
export async function listBlocked() {
  if (DEMO) return ok([...db().blocked].sort((a, b) => a.day.localeCompare(b.day)))
  return unwrap(await sb.from('blocked_dates').select('*').order('day'))
}
export async function addBlocked(row) {
  if (DEMO) return ok(mutate(d => { d.blocked = d.blocked.filter(b => b.day !== row.day); d.blocked.push(row) }))
  return unwrap(await sb.from('blocked_dates').upsert(row).select())
}
export async function removeBlocked(day) {
  if (DEMO) return ok(mutate(d => { d.blocked = d.blocked.filter(b => b.day !== day) }))
  unwrap(await sb.from('blocked_dates').delete().eq('day', day))
}

// ---------------- Appointments ----------------
const ACTIVE = ['pendiente', 'confirmada']
export async function busySlots(fromISO, toISO) {
  if (DEMO) {
    const f = new Date(fromISO), t = new Date(toISO)
    return ok(db().appointments
      .filter(a => ACTIVE.includes(a.status) && new Date(a.starts_at) < t && new Date(a.ends_at) > f)
      .map(a => ({ starts_at: a.starts_at, ends_at: a.ends_at })))
  }
  return unwrap(await sb.rpc('busy_slots', { p_from: fromISO, p_to: toISO }))
}
export async function book({ service_id, service_ids, starts_at, name, phone, email, notes }) {
  const ids = (service_ids && service_ids.length) ? service_ids : [service_id]
  if (DEMO) {
    return mutate(d => {
      const list = ids.map(id => d.services.find(x => x.id === id && x.active))
      if (!list.length || list.some(x => !x)) throw new Error('Algún servicio ya no está disponible')
      const total = list.reduce((t, x) => t + Number(x.duration_min), 0)
      const st = new Date(starts_at), en = new Date(st.getTime() + total * 60000)
      const clash = d.appointments.some(a => ACTIVE.includes(a.status) && new Date(a.starts_at) < en && new Date(a.ends_at) > st)
      if (clash) throw new Error('Ese horario acaba de ocuparse, elige otro')
      const n = { id: uid(), service_id: ids[0], service_ids: ids, service_name: list.map(x => x.name).join(' + '),
        price: list.reduce((t, x) => t + Number(x.price), 0), client_name: name, client_phone: phone,
        client_email: email || null, notes: notes || null, starts_at: st.toISOString(), ends_at: en.toISOString(),
        status: 'pendiente', created_at: new Date().toISOString() }
      d.appointments.push(n); return n.id
    })
  }
  return unwrap(await sb.rpc('book_appointment_multi', {
    p_service_ids: ids, p_starts_at: starts_at, p_name: name, p_phone: phone, p_email: email || '', p_notes: notes || ''
  }))
}
export async function listAppointments(fromISO, toISO) {
  if (DEMO) {
    const f = new Date(fromISO), t = new Date(toISO)
    return ok(db().appointments.filter(a => new Date(a.starts_at) >= f && new Date(a.starts_at) < t)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
  }
  return unwrap(await sb.from('appointments').select('*').gte('starts_at', fromISO).lt('starts_at', toISO).order('starts_at'))
}
export async function setAppointmentStatus(id, status) {
  if (DEMO) return ok(mutate(d => { d.appointments.find(a => a.id === id).status = status }))
  unwrap(await sb.from('appointments').update({ status }).eq('id', id))
}
export async function countPhoneBefore(phone, beforeISO) {
  if (DEMO) return ok(db().appointments.filter(a => a.client_phone === phone && a.starts_at < beforeISO && a.status !== 'cancelada').length)
  const { count, error } = await sb.from('appointments').select('id', { count: 'exact', head: true })
    .eq('client_phone', phone).lt('starts_at', beforeISO).neq('status', 'cancelada')
  if (error) throw new Error(error.message)
  return count
}

// ---------------- Uploads ----------------
export async function uploadImage(file, folder = 'misc') {
  if (DEMO) {
    // En demo se guarda reducida como dataURL para no llenar localStorage
    return await resizeToDataURL(file, 1200)
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${uid()}.${ext}`
  unwrap(await sb.storage.from('media').upload(path, file, { cacheControl: '31536000', upsert: false }))
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl
}
function resizeToDataURL(file, max) {
  return new Promise((res, rej) => {
    const img = new Image(); const r = new FileReader()
    r.onload = () => { img.src = r.result }
    r.onerror = rej
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = rej
    r.readAsDataURL(file)
  })
}

// ---------------- Auth ----------------
export async function getSession() {
  if (DEMO) return sessionStorage.getItem('demo_admin') ? { user: { email: 'admin@demo' } } : null
  return (await sb.auth.getSession()).data.session
}
export function onAuthChange(cb) {
  if (DEMO) return () => {}
  const { data } = sb.auth.onAuthStateChange((_e, s) => cb(s))
  return () => data.subscription.unsubscribe()
}
export async function signIn(email, password) {
  if (DEMO) { sessionStorage.setItem('demo_admin', '1'); return { user: { email } } }
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Correo o contraseña incorrectos')
  return data.session
}
export async function signOut() {
  if (DEMO) { sessionStorage.removeItem('demo_admin'); return }
  await sb.auth.signOut()
}
export function resetDemo() { localStorage.removeItem(LS) }
