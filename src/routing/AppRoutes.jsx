import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Ministries from '../pages/Ministries'
import Sermons from '../pages/Sermons'
import Give from '../pages/Give'
import Calendar from '../pages/Calendar'
import Contact from '../pages/Contact'
import International from '../pages/International'
import Privacy from '../pages/Privacy'
import Permissions from '../pages/Permissions'
import AdminLogin from '../pages/AdminLogin'
import AdminLayout from '../admin/AdminLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminOnlyRoute from '../components/AdminOnlyRoute'
import HomeAdmin from '../admin/HomeAdmin'
import MinistriesAdmin from '../admin/MinistriesAdmin'
import SermonsAdmin from '../admin/SermonsAdmin'
import GiveAdmin from '../admin/GiveAdmin'
import CalendarAdmin from '../admin/CalendarAdmin'
import ContactAdmin from '../admin/ContactAdmin'
import InternationalAdmin from '../admin/InternationalAdmin'
import SettingsAdmin from '../admin/SettingsAdmin'
import AddAccount from '../admin/AddAccount'
import MembersAdmin from '../admin/MembersAdmin'
import AdminPanel from '../admin/AdminPanel'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ministries" element={<Ministries />} />
      <Route path="/sermons" element={<Sermons />} />
      <Route path="/give" element={<Give />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/international" element={<International />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/permissions" element={<Permissions />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="home" element={<HomeAdmin />} />
          <Route path="ministries" element={<MinistriesAdmin />} />
          <Route path="sermons" element={<SermonsAdmin />} />
          <Route path="give" element={<GiveAdmin />} />
          <Route path="calendar" element={<CalendarAdmin />} />
          <Route path="contact" element={<ContactAdmin />} />
          <Route path="international" element={<InternationalAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route element={<AdminOnlyRoute />}>
            <Route path="add-account" element={<AddAccount />} />
            <Route path="add-member" element={<MembersAdmin />} />
            <Route path="panel" element={<AdminPanel />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
