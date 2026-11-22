import { useSite } from './SiteContext'

// Íconos de línea genéricos (mismo trazo que el resto del sitio). Si el salón sube un logo, se usa ese.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }
export const ICONS = {
  bank: { label: 'Banco', svg: <g {...P}><path d="M4 10h24M6 10v12M11 10v12M16 10v12M21 10v12M26 10v12M3 25h26M16 4l12 5H4z" /></g> },
  mobile: { label: 'Pago móvil', svg: <g {...P}><rect x="10" y="3" width="12" height="26" rx="2" /><path d="M14.5 25.5h3M13 7h6" /></g> },
  transfer: { label: 'Transferencia', svg: <g {...P}><path d="M5 11h20l-5-5M27 21H7l5 5" /></g> },
  wallet: { label: 'Billetera', svg: <g {...P}><path d="M5 9h20a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM5 9l16-4v4" /><path d="M21 16h6v5h-6a2.5 2.5 0 0 1 0-5z" /></g> },
  crypto: { label: 'Cripto', svg: <g {...P}><circle cx="16" cy="16" r="12" /><path d="M13 10v12M13 10h4.5a3 3 0 0 1 0 6H13h5a3 3 0 0 1 0 6h-5M15 8v2M15 22v2" /></g> },
  card: { label: 'Tarjeta / en línea', svg: <g {...P}><rect x="3" y="7" width="26" height="18" rx="2" /><path d="M3 12h26M7 20h6" /></g> },
  cash: { label: 'Efectivo', svg: <g {...P}><rect x="3" y="8" width="26" height="16" rx="1.5" /><circle cx="16" cy="16" r="4" /><path d="M7 12v0M25 20v0" /></g> }
}

export function PayIcon({ m, size = 40 }) {
  if (m.icon_url) return <img className="pay-logo" src={m.icon_url} alt="" style={{ height: size }} />
  return <svg className="pay-ico" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">{(ICONS[m.icon_key] || ICONS.bank).svg}</svg>
}

export default function PaymentMethods({ compact = false }) {
  const { payments } = useSite()
  if (!payments?.length) return null
  return (
    <section className={`section ${compact ? '' : 'band'}`} id="pagos">
      <div className="wrap">
        <div className="pay-head">
          <h2 className="h-heading">Métodos<br />de pago</h2>
          <p className="muted" style={{ maxWidth: 360, fontSize: 14 }}>Al confirmar tu cita por WhatsApp te enviamos los datos para el pago.</p>
        </div>
        <ul className="pay-grid">
          {payments.map(m => (
            <li key={m.id} className="pay-item">
              <PayIcon m={m} />
              <div>
                <div className="pay-name">{m.name}</div>
                {m.detail && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{m.detail}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
