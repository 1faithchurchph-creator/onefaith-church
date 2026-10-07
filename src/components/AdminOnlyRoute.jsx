import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const AdminOnlyRoute = () => {
  const stored = localStorage.getItem('user')
  const user = stored ? JSON.parse(stored) : null

  if (!user || !user.is_admin) {
    return <Navigate to="/admin/home" replace />
  }

  return <Outlet />
}

export default AdminOnlyRoute
