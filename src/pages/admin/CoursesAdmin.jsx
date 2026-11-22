import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ImageUpload from './ImageUpload'
import { COURSE_STATUS } from '../Courses'
import { money } from '../../lib/time'

const EMPTY = { title: '', subtitle: '', description: '', includes: '', status: 'proximamente', start_text: '', price: '', image_url: null, active: true, sort_order: 0 }

export default function CoursesAdmin() {
  const { reload } = useSite()
  const [list, setList] = useState([])
  const [edit, setEdit] = useState(null)
  const load = async () => { setList(await api.listCourses({ all: true })); reload() }
  useEffect(() => { load() }, []) // eslint-disable-line

  const toggle = async (c) => { await api.saveCourse({ ...c, active: !c.active }); load() }
  const del = async (c) => { if (confirm(`¿Eliminar el curso «${c.title}»?`)) { await api.deleteCourse(c.id); load() } }

  return (
    <>
      <Head title="Cursos"><button className="btn-line solid" onClick={() => setEdit({ ...EMPTY, sort_order: list.length + 1 })}>Nuevo curso</button></Head>
      <p className="muted" style={{ marginTop: -8, marginBottom: 24, fontSize: 13 }}>Sube el afiche del curso en formato vertical (como las publicaciones de Instagram de 4:5 o historias). Se muestra completo en la página de Cursos.</p>
      {!list.length && <p className="muted">Aún no hay cursos. Agrega el primero.</p>}
      <div className="courses admin-courses">
        {list.map(c => (
          <article key={c.id} className={`course ${c.active ? '' : 'dim'}`}>
            <div className="course-ph">
              {c.image_url ? <img src={c.image_url} alt="" /> : <span className="ph-empty">{c.title[0]}</span>}
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <span className={`course-st st-${c.status}`}>{COURSE_STATUS[c.status]}</span>
              <div style={{ color: 'var(--ink)' }}>{c.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{[c.subtitle, c.start_text, c.price != null ? money(c.price) : null].filter(Boolean).join(' · ')}</div>
              <label className="check"><input type="checkbox" checked={c.active} onChange={() => toggle(c)} />Visible en el sitio</label>
              <div className="toolbar" style={{ gap: 16 }}>
                <button className="ghost" onClick={() => setEdit({ ...c, price: c.price ?? '' })}>Editar</button>
                <button className="ghost" onClick={() => del(c)}>Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {edit && <CourseForm initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </>
  )
}

function CourseForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = async (e) => {
    e.preventDefault()
    if (!f.title.trim()) return setErr('El título es obligatorio.')
    setBusy(true)
    try { await api.saveCourse(f); onSaved() } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal stack" onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2 className="h-sub">{f.id ? 'Editar curso' : 'Nuevo curso'}</h2>
        <div className="form-grid">
          <div className="full"><ImageUpload value={f.image_url} onChange={(url) => setF({ ...f, image_url: url })} folder="courses" label="Subir afiche" /></div>
          <label className="f full"><span>Título</span><input className="in" value={f.title} onChange={set('title')} placeholder="Pestañas · Curso intensivo" autoFocus /></label>
          <label className="f full"><span>Subtítulo</span><input className="in" value={f.subtitle || ''} onChange={set('subtitle')} placeholder="Micropigmentación de cejas" /></label>
          <label className="f"><span>Estado</span>
            <select className="in" value={f.status} onChange={set('status')}>
              {Object.entries(COURSE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="f"><span>Fecha (texto libre)</span><input className="in" value={f.start_text || ''} onChange={set('start_text')} placeholder="Enero 2027" /></label>
          <label className="f"><span>Precio USD (opcional)</span><input className="in" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} /></label>
          <label className="f"><span>Orden</span><input className="in" type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
          <label className="f full"><span>Incluye</span><input className="in" value={f.includes || ''} onChange={set('includes')} placeholder="Kit, certificado, coffee break, asesoría personalizada" /></label>
          <label className="f full"><span>Descripción</span><textarea className="in" value={f.description || ''} onChange={set('description')} /></label>
          <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} />Visible en el sitio</label>
        </div>
        {err && <div className="err">{err}</div>}
        <div className="toolbar"><button className="btn-line solid" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" className="ghost" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  )
}
