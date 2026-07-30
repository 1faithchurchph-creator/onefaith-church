import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/image.png'
import '../css/admin.css'

const AdminLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (username === 'admin' && password === 'admin123') {
      navigate('/dashboard')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img src={logo} alt="Church Logo" className="admin-login-logo" />
        <h1>Admin Login</h1>
        {error && <p className="admin-login-error">{error}</p>}
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
