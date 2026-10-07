import React, { useState } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import PasswordInput from '../components/PasswordInput'
import Toast from '../components/Toast'
import '../css/admin-forms.css'

const AddAccount = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [toast, setToast] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    setToast(null)

    const hash = bcrypt.hashSync(password, 10)

    const { error: insertErr } = await supabase
      .from('1faithauth')
      .insert({ username, password: hash, display_name: displayName, is_admin: false })

    if (insertErr) {
      setToast({ message: insertErr.message, type: 'error' })
      return
    }

    setToast({ message: `Account "${username}" created successfully.`, type: 'success' })
    setUsername('')
    setPassword('')
    setDisplayName('')
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Add Account</h1>

      <form onSubmit={handleCreate} className="admin-form">
        <div className="admin-form-group">
          <label htmlFor="add-username">Username</label>
          <input id="add-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="admin-form-group">
          <label htmlFor="add-password">Password</label>
          <PasswordInput id="add-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="admin-form-group">
          <label htmlFor="add-display">Display Name</label>
          <input id="add-display" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>

        <button type="submit" className="btn-primary">Create Account</button>
      </form>
    </div>
  )
}

export default AddAccount
