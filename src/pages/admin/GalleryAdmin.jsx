import { useEffect, useRef, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'

export default function GalleryAdmin() {
  const { reload } = useSite()
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState('')
  const ref = useRef()
  const load = async () => { setItems(await api.listGallery()); reload() }
  useEffect(() => { load() }, []) // eslint-disable-line

  const upload = async (e) => {
    const files = [...(e.target.files || [])]
    for (let i = 0; i < files.length; i++) {
      setBusy(`Subiendo ${i + 1} de ${files.length}…`)
      try {
        const url = await api.uploadImage(files[i], 'gallery')
        await api.addGallery({ image_url: url, caption: '', sort_order: items.length + i + 1 })
      } catch (err) { alert(`No se pudo subir ${files[i].name}: ${err.message}`) }
    }
    setBusy(''); e.target.value = ''; load()
  }
  const caption = async (g) => { const c = prompt('Texto de la foto (opcional)', g.caption || ''); if (c !== null) { await api.updateGallery({ ...g, caption: c }); load() } }
  const del = async (g) => { if (confirm('¿Eliminar esta foto?')) { await api.deleteGallery(g.id); load() } }

  return (
    <>
      <Head title="Fotos"><button className="btn-line solid" onClick={() => ref.current.click()} disabled={!!busy}>{busy || 'Subir fotos'}</button></Head>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={upload} />
      <p className="muted" style={{ marginBottom: 24 }}>Estas fotos aparecen en la sección Galería de la página de inicio. Puedes subir varias a la vez.</p>
      <div className="gal-admin">
        {items.map(g => (
          <div key={g.id} className="it">
            <img src={g.image_url} alt="" />
            <div className="muted" style={{ fontSize: 12, minHeight: 18, margin: '8px 0' }}>{g.caption}</div>
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <button className="ghost" onClick={() => caption(g)}>Texto</button>
              <button className="ghost" onClick={() => del(g)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {!items.length && <p className="muted">Aún no hay fotos.</p>}
    </>
  )
}
