import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ImageUpload from './ImageUpload'
import { money, dur } from '../../lib/time'

const EMPTY = { name: '', description: '', price: '', price_from: false, duration_min: 60, category_id: '', image_url: null, featured: false, active: true, sort_order: 0 }

export default function ServicesAdmin() {
  const { reload } = useSite()
  const [cats, setCats] = useState([])
  const [svcs, setSvcs] = useState([])
  const [edit, setEdit] = useState(null)
  const [newCat, setNewCat] = useState('')

  const load = async () => {
    const [c, s] = await Promise.all([api.listCategories(), api.listServices({ all: true })])
    setCats(c); setSvcs(s); reload()
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  const addCat = async (e) => { e.preventDefault(); if (!newCat.trim()) return; await api.saveCategory({ name: newCat.trim(), sort_order: cats.length + 1 }); setNewCat(''); load() }
  const renameCat = async (c) => { const n = prompt('Nuevo nombre de la categoría', c.name); if (n && n.trim()) { await api.saveCategory({ ...c, name: n.trim() }); load() } }
  const delCat = async (c) => { if (confirm(`¿Eliminar la categoría «${c.name}»? Sus servicios quedarán en «Otros».`)) { await api.deleteCategory(c.id); load() } }
  const moveCat = async (c, dir) => {
    const list = [...cats]; const i = list.findIndex(x => x.id === c.id); const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    await Promise.all(list.map((x, k) => api.saveCategory({ ...x, sort_order: k + 1 }))); load()
  }
  const toggle = async (s, k) => { await api.saveService({ ...s, [k]: !s[k] }); load() }
  const del = async (s) => { if (confirm(`¿Eliminar «${s.name}»? Las citas anteriores se conservan.`)) { await api.deleteService(s.id); load() } }

  return (
    <>
      <Head title="Servicios y precios"><button className="btn-line solid" onClick={() => setEdit({ ...EMPTY, category_id: cats[0]?.id || '' })}>Nuevo servicio</button></Head>

      <div className="panel">
        <p className="caption muted" style={{ marginBottom: 12 }}>Categorías</p>
        <div className="chips" style={{ marginBottom: 16 }}>
          {cats.map((c, i) => (
            <span key={c.id} className="chip" style={{ cursor: 'default', display: 'inline-flex', gap: 10, background: 'var(--white)' }}>
              {c.name}
              <button className="ghost" style={{ fontSize: 11, padding: 0 }} onClick={() => moveCat(c, -1)} disabled={i === 0} title="Mover antes">←</button>
              <button className="ghost" style={{ fontSize: 11, padding: 0 }} onClick={() => moveCat(c, 1)} disabled={i === cats.length - 1} title="Mover después">→</button>
              <button className="ghost" style={{ fontSize: 11, padding: 0 }} onClick={() => renameCat(c)}>Editar</button>
              <button className="ghost" style={{ fontSize: 11, padding: 0 }} onClick={() => delCat(c)}>×</button>
            </span>
          ))}
        </div>
        <form className="toolbar" onSubmit={addCat}>
          <input className="in" style={{ maxWidth: 280, background: 'var(--white)' }} placeholder="Nueva categoría" value={newCat} onChange={e => setNewCat(e.target.value)} />
          <button className="btn-line">Agregar</button>
        </form>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th /><th>Servicio</th><th>Categoría</th><th>Precio</th><th>Duración</th><th>Visible</th><th>Bestseller</th><th /></tr></thead>
          <tbody>
            {svcs.map(s => (
              <tr key={s.id} className={s.active ? '' : 'dim'}>
                <td>{s.image_url ? <img className="thumb" src={s.image_url} alt="" /> : <div className="thumb" />}</td>
                <td style={{ color: 'var(--ink)' }}>{s.name}</td>
                <td>{cats.find(c => c.id === s.category_id)?.name || 'Otros'}</td>
                <td>{s.price_from ? 'desde ' : ''}{money(s.price)}</td>
                <td>{dur(s.duration_min)}</td>
                <td><label className="check"><input type="checkbox" checked={s.active} onChange={() => toggle(s, 'active')} /></label></td>
                <td><label className="check"><input type="checkbox" checked={s.featured} onChange={() => toggle(s, 'featured')} /></label></td>
                <td><div className="row-actions"><button className="ghost" onClick={() => setEdit(s)}>Editar</button><button className="ghost" onClick={() => del(s)}>Eliminar</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!svcs.length && <p className="muted" style={{ marginTop: 16 }}>Aún no hay servicios. Agrega el primero.</p>}
      </div>
      {edit && <ServiceForm initial={edit} cats={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </>
  )
}

function ServiceForm({ initial, cats, onClose, onSaved }) {
  const [f, setF] = useState({ ...initial, category_id: initial.category_id || '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('El nombre es obligatorio.')
    if (!(Number(f.duration_min) > 0)) return setErr('La duración debe ser mayor a 0.')
    setBusy(true)
    try { await api.saveService(f); onSaved() } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal stack" onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2 className="h-sub">{f.id ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <div className="form-grid">
          <label className="f full"><span>Nombre</span><input className="in" value={f.name} onChange={set('name')} autoFocus /></label>
          <label className="f"><span>Categoría</span>
            <select className="in" value={f.category_id} onChange={set('category_id')}>
              <option value="">Otros</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="f"><span>Duración (minutos)</span><input className="in" type="number" min="5" step="5" value={f.duration_min} onChange={set('duration_min')} /></label>
          <label className="f"><span>Precio (USD)</span><input className="in" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} /></label>
          <label className="f"><span>Orden</span><input className="in" type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
          <label className="f full"><span>Descripción</span><textarea className="in" value={f.description || ''} onChange={set('description')} /></label>
          <div className="full"><ImageUpload value={f.image_url} onChange={(url) => setF({ ...f, image_url: url })} folder="services" /></div>
          <label className="check"><input type="checkbox" checked={f.price_from} onChange={set('price_from')} />Mostrar como «desde»</label>
          <label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} />Etiqueta Bestseller</label>
          <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} />Visible en el sitio</label>
        </div>
        {err && <div className="err">{err}</div>}
        <div className="toolbar"><button className="btn-line solid" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" className="ghost" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  )
}
