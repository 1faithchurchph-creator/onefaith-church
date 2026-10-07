import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/image.png'
import '../css/sidebar.css'

const navItems = [
  { to: '/admin/home', label: 'Home' },
  { to: '/admin/ministries', label: 'Ministries' },
  { to: '/admin/sermons', label: 'Sermons' },
  { to: '/admin/give', label: 'Give' },
  { to: '/admin/calendar', label: 'Calendar' },
  { to: '/admin/contact', label: 'Contact Us' },
  { to: '/admin/international', label: 'International' },
]

const adminItems = [
  { to: '/admin/add-account', label: 'Add Account' },
  { to: '/admin/add-member', label: 'Add Member' },
  { to: '/admin/panel', label: 'Admin Panel' },
]

const Sidebar = () => {
  const [open, setOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const bottomItems = [
    { to: '/admin/settings', label: 'Settings' },
    ...(user.is_admin ? adminItems : []),
  ]

  const doLogout = async () => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    if (stored.id) {
      await supabase
        .from('1faithauth')
        .update({ is_logged_in: false })
        .eq('id', stored.id)
    }
    localStorage.removeItem('user')
    navigate('/admin')
  }

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        <span />
        <span />
        <span />
      </button>

      <div className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/admin/home" onClick={() => setOpen(false)}>
            <img src={logo} alt="One Faith Church" />
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/home'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          <hr className="sidebar-divider" />

          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/home'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          <hr className="sidebar-divider" />

          <button className="sidebar-logout" onClick={() => setLogoutOpen(true)}>
            Logout
          </button>
        </nav>
      </div>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {logoutOpen && (
        <div className="sidebar-modal-backdrop" onClick={() => setLogoutOpen(false)}>
          <div className="sidebar-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sidebar-modal__title">Log out?</h3>
            <p className="sidebar-modal__text">Are you sure you want to log out of the admin panel?</p>
            <div className="sidebar-modal__actions">
              <button type="button" className="sidebar-modal__cancel" onClick={() => setLogoutOpen(false)}>
                Cancel
              </button>
              <button type="button" className="sidebar-modal__confirm" onClick={doLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
