import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Ministries from '../pages/Ministries'
import Sermons from '../pages/Sermons'
import Give from '../pages/Give'
import Calendar from '../pages/Calendar'
import Contact from '../pages/Contact'
import AdminLogin from '../pages/AdminLogin'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ministries" element={<Ministries />} />
      <Route path="/sermons" element={<Sermons />} />
      <Route path="/give" element={<Give />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<AdminLogin />} />
    </Routes>
  )
}

export default AppRoutes