import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import PasswordInput from '../components/PasswordInput'
import Toast from '../components/Toast'
import logo from '../assets/image.png'
import '../css/admin.css'

const AdminLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setToast(null)

    const { data: user, error: queryError } = await supabase
      .from('1faithauth')
      .select('*')
      .eq('username', username)
      .single()

    if (queryError || !user) {
      setToast({ message: 'Invalid credentials', type: 'error' })
      return
    }

    if (user.blocked) {
      setToast({ message: 'Your account has been blocked.', type: 'error' })
      return
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      setToast({ message: 'Invalid credentials', type: 'error' })
      return
    }

    const { error: loginErr } = await supabase
      .from('1faithauth')
      .update({ is_logged_in: true })
      .eq('id', user.id)

    if (!loginErr) {
      user.is_logged_in = true
    }

    localStorage.setItem('user', JSON.stringify(user))
    navigate('/admin/home')
  }

  return (
    <div className="admin-login-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="admin-login-card">
        <img src={logo} alt="Church Logo" className="admin-login-logo" />
        <h1>Admin Login</h1>
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
          <PasswordInput
            id="password"
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
