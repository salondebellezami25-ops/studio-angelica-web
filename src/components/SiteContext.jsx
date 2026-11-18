import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as api from '../lib/api'

const Ctx = createContext(null)
export const useSite = () => useContext(Ctx)

export function SiteProvider({ children }) {
  const [state, setState] = useState({ loading: true, settings: null, categories: [], services: [], gallery: [], hours: [], blocked: [] })
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const [settings, categories, services, gallery, hours, blocked] = await Promise.all([
        api.getSettings(), api.listCategories(), api.listServices(), api.listGallery(), api.getHours(), api.listBlocked()
      ])
      setState({ loading: false, settings, categories, services, gallery, hours, blocked })
      if (settings?.salon_name) document.title = `${settings.salon_name} · Reserva tu cita`
    } catch (e) { setError(e.message); setState(s => ({ ...s, loading: false })) }
  }, [])

  useEffect(() => { reload() }, [reload])
  return <Ctx.Provider value={{ ...state, error, reload }}>{children}</Ctx.Provider>
}
