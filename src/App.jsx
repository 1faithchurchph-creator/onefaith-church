import React from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppRoutes from './routing/AppRoutes'

const AppLayout = () => {
  const location = useLocation()
  const isBareRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/permissions') ||
    location.pathname.startsWith('/privacy')

  return (
    <>
      {!isBareRoute && <Navbar />}
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
