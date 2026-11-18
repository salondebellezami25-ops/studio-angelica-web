import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { useSite } from '../../components/SiteContext'
import { Head } from './AdminLayout'
import ImageUpload from './ImageUpload'
import { THEMES, activeTheme, autoRanges, fmtRange } from '../../lib/themes'

const FIELDS = ['salon_name', 'tagline', 'logo_url', 'hero_url', 'about', 'address', 'maps_query', 'phone', 'whatsapp', 'instagram', 'policies', 'promo_title', 'promo_items', 'theme', 'theme_message']

export default function SettingsAdmin() {
  const { settings, reload } = useSite()
  const [f, setF] = useState(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const x = Object.fromEntries(FIELDS.map(k => [k, settings[k] ?? '']))
    x.policies = (settings.policies || []).join('\n'); x.promo_items = (settings.promo_items || []).join('\n')
    setF(x)
  }, [settings])
  if (!f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const lines = (t) => t.split('\n').map(s => s.trim()).filter(Boolean)

  const save = async (e) => {
    e.preventDefault()
    try {
      await api.saveSettings({
        ...f, theme: f.theme || 'none', theme_message: (f.theme_message || '').trim() || null, logo_url: f.logo_url || null, hero_url: f.hero_url || null,
        whatsapp: String(f.whatsapp).replace(/\D/g, ''), instagram: String(f.instagram).replace(/^@/, '').trim(),
        policies: lines(f.policies), promo_items: lines(f.promo_items)
      })
      await reload(); setMsg('Cambios guardados.'); setTimeout(() => setMsg(''), 2500)
    } catch (e2) { setMsg('Error: ' + e2.message) }
  }

  return (
    <form onSubmit={save}>
      <Head title="Ajustes del sitio"><button className="btn-line solid">Guardar cambios</button></Head>
      {msg && <div className="note" style={{ marginBottom: 24 }}>{msg}</div>}

      <div className="panel"><p className="caption muted" style={{ marginBottom: 16 }}>Marca</p>
        <div className="form-grid">
          <label className="f"><span>Nombre del salón</span><input className="in" style={{ background: 'var(--white)' }} value={f.salon_name} onChange={set('salon_name')} required /></label>
          <label className="f"><span>Frase principal</span><input className="in" style={{ background: 'var(--white)' }} value={f.tagline} onChange={set('tagline')} /></label>
          <div><p className="caption muted" style={{ margin: '0 0 8px' }}>Logo</p><ImageUpload value={f.logo_url || null} onChange={(u) => setF({ ...f, logo_url: u })} folder="brand" label="Subir logo" /></div>
          <div><p className="caption muted" style={{ margin: '0 0 8px' }}>Foto de portada</p><ImageUpload value={f.hero_url || null} onChange={(u) => setF({ ...f, hero_url: u })} folder="brand" label="Subir portada" /></div>
          <label className="f full"><span>Sobre nosotros</span><textarea className="in" style={{ background: 'var(--white)' }} value={f.about} onChange={set('about')} /></label>
        </div>
      </div>

      <div className="panel"><p className="caption muted" style={{ marginBottom: 16 }}>Contacto y ubicación</p>
        <div className="form-grid">
          <label className="f full"><span>Dirección</span><input className="in" style={{ background: 'var(--white)' }} value={f.address} onChange={set('address')} /></label>
          <label className="f full"><span>Búsqueda para el mapa (dirección o «lat,lng»)</span><input className="in" style={{ background: 'var(--white)' }} placeholder="8.9824,-79.5199" value={f.maps_query} onChange={set('maps_query')} /></label>
          <label className="f"><span>Teléfono visible</span><input className="in" style={{ background: 'var(--white)' }} value={f.phone} onChange={set('phone')} /></label>
          <label className="f"><span>WhatsApp (con 507)</span><input className="in" style={{ background: 'var(--white)' }} placeholder="50760000000" value={f.whatsapp} onChange={set('whatsapp')} /></label>
          <label className="f"><span>Instagram (usuario)</span><input className="in" style={{ background: 'var(--white)' }} value={f.instagram} onChange={set('instagram')} /></label>
        </div>
      </div>


      <div className="panel"><p className="caption muted" style={{ marginBottom: 16 }}>Tema de temporada</p>
        <div className="form-grid">
          <label className="f"><span>Tema</span>
            <select className="in" style={{ background: 'var(--white)' }} value={f.theme || 'none'} onChange={set('theme')}>
              <option value="auto">Automático por fecha (calendario de Venezuela)</option>
              {Object.entries(THEMES).map(([id, t]) => <option key={id} value={id}>{t.name}</option>)}
            </select>
          </label>
          <label className="f"><span>Mensaje de la franja (opcional)</span>
            <input className="in" style={{ background: 'var(--white)' }} value={f.theme_message || ''} onChange={set('theme_message')}
              placeholder={f.theme && f.theme !== 'auto' && THEMES[f.theme]?.msg ? THEMES[f.theme].msg : 'Vacío = mensaje propio de cada tema'} />
          </label>
          <div className="full" style={{ fontSize: 13 }}>
            {(() => { const id = activeTheme(f); const t = THEMES[id]; return (
              <p style={{ display: 'flex', gap: 10, alignItems: 'center', margin: 0 }}>
                Tema activo hoy: <b style={{ fontWeight: 400, color: 'var(--ink)' }}>{t.name}</b>
                {id !== 'none' && <><span style={{ width: 16, height: 16, background: t.accent, display: 'inline-block' }} /><span style={{ width: 16, height: 16, background: t.accent2, display: 'inline-block' }} /></>}
              </p>) })()}
            {f.theme === 'auto' && (
              <ul className="muted" style={{ margin: '12px 0 0', paddingLeft: 18, columns: 2 }}>
                {autoRanges(new Date().getFullYear()).slice(1).map(([id, a, b], i) => <li key={i}>{THEMES[id].name}: {id === 'navidad' ? '1 dic – 6 ene' : fmtRange(a, b)}</li>)}
              </ul>
            )}
            <p className="muted" style={{ margin: '12px 0 0' }}>Recuerda darle a «Guardar cambios». En modo automático, deja el mensaje vacío para que cada temporada use el suyo.</p>
          </div>
        </div>
      </div>
      <div className="panel"><p className="caption muted" style={{ marginBottom: 16 }}>Políticas y promoción</p>
        <div className="form-grid">
          <label className="f full"><span>Políticas de la cita (una por línea)</span><textarea className="in" style={{ background: 'var(--white)', minHeight: 160 }} value={f.policies} onChange={set('policies')} /></label>
          <label className="f"><span>Título de la promoción (vacío = oculta)</span><input className="in" style={{ background: 'var(--white)' }} value={f.promo_title} onChange={set('promo_title')} /></label>
          <label className="f"><span>Beneficios (uno por línea)</span><textarea className="in" style={{ background: 'var(--white)' }} value={f.promo_items} onChange={set('promo_items')} /></label>
        </div>
      </div>
    </form>
  )
}
