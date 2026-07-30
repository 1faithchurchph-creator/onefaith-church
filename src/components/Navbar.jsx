//This would be the navbar it contains the logo and the links Home, Ministries, Sermons, Give, Calendar and Contact using react-router-dom to navigate between pages
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import logo from '../assets/image.png'
import cover from '../assets/cover.png'
import '../css/navbar.css'

const Logo = () => {
  return (
    <NavLink to="/" end className="navbar-logo">
      <img src={logo} alt="Church Logo" />
    </NavLink>
  )
}

const Navbar = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className={`navbar${isHome ? ' navbar--home' : ''}`}>
      {isHome && (
        <div className="navbar-media" aria-hidden="true">
          <img src={cover} alt="" />
        </div>
      )}
      <div className="navbar-content">
        <Logo />

        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/ministries" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Ministries
          </NavLink>
          <NavLink to="/sermons" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Sermons
          </NavLink>
          <NavLink to="/give" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Give
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Calendar
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `contact-box${isActive ? ' active' : ''}`}>
            Contact Us
          </NavLink>
        </nav>
      </div>
    </div>
  )
}


export default Navbar
