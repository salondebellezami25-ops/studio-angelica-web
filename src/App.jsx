import { Routes, Route, Navigate } from 'react-router-dom'
import { SiteProvider } from './components/SiteContext'
import SiteLayout from './components/SiteLayout'
import Home from './pages/Home'
import Services from './pages/Services'
import Booking from './pages/Booking'
import AdminLayout from './pages/admin/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Appointments from './pages/admin/Appointments'
import ServicesAdmin from './pages/admin/ServicesAdmin'
import GalleryAdmin from './pages/admin/GalleryAdmin'
import Schedule from './pages/admin/Schedule'
import SettingsAdmin from './pages/admin/SettingsAdmin'

export default function App() {
  return (
    <SiteProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="servicios" element={<Services />} />
          <Route path="reservar" element={<Booking />} />
        </Route>
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="citas" element={<Appointments />} />
          <Route path="servicios" element={<ServicesAdmin />} />
          <Route path="galeria" element={<GalleryAdmin />} />
          <Route path="horarios" element={<Schedule />} />
          <Route path="ajustes" element={<SettingsAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteProvider>
  )
}
