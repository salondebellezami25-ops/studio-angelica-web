import { useRef, useState } from 'react'
import * as api from '../../lib/api'

export default function ImageUpload({ value, onChange, folder = 'misc', label = 'Subir foto' }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 8 * 1024 * 1024) return setErr('La imagen pesa más de 8 MB.')
    setBusy(true); setErr('')
    try { onChange(await api.uploadImage(file, folder)) } catch (e2) { setErr(e2.message) } finally { setBusy(false); e.target.value = '' }
  }
  return (
    <div>
      <div className="upload" onClick={() => ref.current.click()}>
        {value ? <img src={value} alt="" /> : <div className="thumb" style={{ width: 72, height: 72 }} />}
        <div>
          <div className="ghost" style={{ display: 'inline-block' }}>{busy ? 'Subiendo…' : value ? 'Cambiar foto' : label}</div>
          <div className="muted" style={{ fontSize: 12 }}>JPG o PNG, máx. 8 MB</div>
        </div>
        {value && <button type="button" className="ghost" style={{ marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); onChange(null) }}>Quitar</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  )
}
