//This would be the navbar it contains the logo and the links Home, Ministries, Sermons, Give, Calendar and Contact using react-router-dom to navigate between pages
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useHomeContent } from '../lib/homeContent'
import logo from '../assets/image.png'
import '../css/navbar.css'

const Logo = ({ src }) => {
  return (
    <NavLink to="/" end className="navbar-logo">
      <img src={src} alt="Church Logo" />
    </NavLink>
  )
}

const Navbar = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { map } = useHomeContent()
  const coverUrl = map['navbar_cover'] || ''
  const coverPosition = map['navbar_cover_position'] || '50% 50%'

  return (
    <div className={`navbar${isHome ? ' navbar--home' : ''}`}>
      {isHome && (
        <div className="navbar-media" aria-hidden="true">
          {coverUrl ? <img src={coverUrl} alt="" style={{ objectPosition: coverPosition }} /> : <div className="navbar-media__skeleton" />}
        </div>
      )}
      <div className="navbar-content">
        <Logo src={logo} />

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
