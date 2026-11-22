import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ImageUpload from './ImageUpload'
import { ICONS, PayIcon } from '../../components/PaymentMethods'

const EMPTY = { name: '', detail: '', icon_key: 'bank', icon_url: null, active: true, sort_order: 0 }

export default function PaymentsAdmin() {
  const { reload } = useSite()
  const [list, setList] = useState([])
  const [edit, setEdit] = useState(null)
  const load = async () => { setList(await api.listPayments({ all: true })); reload() }
  useEffect(() => { load() }, []) // eslint-disable-line

  const toggle = async (m) => { await api.savePayment({ ...m, active: !m.active }); load() }
  const del = async (m) => { if (confirm(`¿Eliminar «${m.name}»?`)) { await api.deletePayment(m.id); load() } }
  const move = async (m, dir) => {
    const l = [...list]; const i = l.findIndex(x => x.id === m.id); const j = i + dir
    if (j < 0 || j >= l.length) return
    ;[l[i], l[j]] = [l[j], l[i]]
    await Promise.all(l.map((x, k) => api.savePayment({ ...x, sort_order: k + 1 }))); load()
  }

  return (
    <>
      <Head title="Métodos de pago"><button className="btn-line solid" onClick={() => setEdit({ ...EMPTY, sort_order: list.length + 1 })}>Nuevo método</button></Head>
      <p className="muted" style={{ marginTop: -8, marginBottom: 24, fontSize: 13 }}>Se muestran en la página principal después de los servicios. Puedes usar un ícono de línea o subir el logo oficial del banco o billetera.</p>
      <ul className="pay-grid admin">
        {list.map((m, i) => (
          <li key={m.id} className={`pay-item ${m.active ? '' : 'dim'}`}>
            <PayIcon m={m} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pay-name">{m.name}</div>
              {m.detail && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{m.detail}</div>}
              <div className="toolbar" style={{ gap: 14, marginTop: 10, fontSize: 12 }}>
                <label className="check"><input type="checkbox" checked={m.active} onChange={() => toggle(m)} />Visible</label>
                <button className="ghost" onClick={() => move(m, -1)} disabled={i === 0} title="Subir">↑</button>
                <button className="ghost" onClick={() => move(m, 1)} disabled={i === list.length - 1} title="Bajar">↓</button>
                <button className="ghost" onClick={() => setEdit(m)}>Editar</button>
                <button className="ghost" onClick={() => del(m)}>Eliminar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!list.length && <p className="muted">Aún no hay métodos de pago.</p>}
      {edit && <PayForm initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </>
  )
}

function PayForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('El nombre es obligatorio.')
    setBusy(true)
    try { await api.savePayment(f); onSaved() } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal stack" onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2 className="h-sub">{f.id ? 'Editar método de pago' : 'Nuevo método de pago'}</h2>
        <div className="form-grid">
          <label className="f"><span>Nombre</span><input className="in" value={f.name} onChange={set('name')} placeholder="Zelle" autoFocus /></label>
          <label className="f"><span>Detalle (opcional)</span><input className="in" value={f.detail || ''} onChange={set('detail')} placeholder="Transferencia en dólares" /></label>
          <div className="f full"><span>Ícono</span>
            <div className="toolbar" style={{ gap: 8 }}>
              {Object.entries(ICONS).map(([k, v]) => (
                <button type="button" key={k} title={v.label} onClick={() => setF({ ...f, icon_key: k })}
                  className={`icon-pick ${f.icon_key === k && !f.icon_url ? 'on' : ''}`}><PayIcon m={{ icon_key: k }} size={28} /></button>
              ))}
            </div>
          </div>
          <div className="full">
            <p className="caption muted" style={{ margin: '4px 0 8px' }}>O sube el logo (PNG con fondo transparente, opcional)</p>
            <ImageUpload value={f.icon_url} onChange={(url) => setF({ ...f, icon_url: url })} folder="payments" label="Subir logo" />
          </div>
          <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} />Visible en el sitio</label>
        </div>
        {err && <div className="err">{err}</div>}
        <div className="toolbar"><button className="btn-line solid" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" className="ghost" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  )
}
