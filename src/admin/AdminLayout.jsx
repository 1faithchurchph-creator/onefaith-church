import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import SessionWatcher from '../components/SessionWatcher'
import '../css/admin-layout.css'

const AdminLayout = () => {
  return (
    <>
      <SessionWatcher />
      <Sidebar />
      <div className="admin-page">
        <Outlet />
      </div>
    </>
  )
}

export default AdminLayout
