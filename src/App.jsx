import React from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppRoutes from './routing/AppRoutes'

const AppLayout = () => {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'

  return (
    <>
      {!isAdmin && <Navbar />}
      <AppRoutes />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App