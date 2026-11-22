import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as api from '../lib/api'
import { setRate } from '../lib/time'

const Ctx = createContext(null)
export const useSite = () => useContext(Ctx)

export function SiteProvider({ children }) {
  const [state, setState] = useState({ loading: true, settings: null, categories: [], services: [], gallery: [], hours: [], blocked: [], courses: [], payments: [] })
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const safe = (p) => p.catch(() => [])
      const [settings, categories, services, gallery, hours, blocked, courses, payments] = await Promise.all([
        api.getSettings(), api.listCategories(), api.listServices(), api.listGallery(), api.getHours(), api.listBlocked(),
        safe(api.listCourses()), safe(api.listPayments())
      ])
      setRate(settings?.show_bs ? settings.usd_ves_rate : 0)
      setState({ loading: false, settings, categories, services, gallery, hours, blocked, courses, payments })
      if (settings?.salon_name) document.title = `${settings.salon_name} · Reserva tu cita`
    } catch (e) { setError(e.message); setState(s => ({ ...s, loading: false })) }
  }, [])

  useEffect(() => { reload() }, [reload])
  return <Ctx.Provider value={{ ...state, error, reload }}>{children}</Ctx.Provider>
}
