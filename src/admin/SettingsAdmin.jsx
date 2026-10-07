import React, { useState } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import PasswordInput from '../components/PasswordInput'
import Toast from '../components/Toast'
import '../css/admin-forms.css'

const SettingsAdmin = () => {
  const stored = JSON.parse(localStorage.getItem('user') || '{}')
  const [username, setUsername] = useState(stored.username || '')
  const [displayName, setDisplayName] = useState(stored.display_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [toast, setToast] = useState(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setToast(null)

    if (!currentPassword) {
      setToast({ message: 'Enter your current password to save changes.', type: 'error' })
      return
    }

    const { data: user, error: fetchErr } = await supabase
      .from('1faithauth')
      .select('password')
      .eq('id', stored.id)
      .single()

    if (fetchErr || !user) {
      setToast({ message: 'Unable to verify identity.', type: 'error' })
      return
    }

    const valid = bcrypt.compareSync(currentPassword, user.password)
    if (!valid) {
      setToast({ message: 'Current password is incorrect.', type: 'error' })
      return
    }

    const updates = { username, display_name: displayName }
    if (newPassword) {
      updates.password = bcrypt.hashSync(newPassword, 10)
    }

    const { error: updateErr } = await supabase
      .from('1faithauth')
      .update(updates)
      .eq('id', stored.id)

    if (updateErr) {
      setToast({ message: updateErr.message, type: 'error' })
      return
    }

    const updated = { ...stored, ...updates }
    delete updated.password
    localStorage.setItem('user', JSON.stringify(updated))
    setToast({ message: 'Account updated successfully.', type: 'success' })
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Settings</h1>

      <form onSubmit={handleSave} className="admin-form">
        <div className="admin-form-group">
          <label htmlFor="set-username">Username</label>
          <input id="set-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="admin-form-group">
          <label htmlFor="set-display">Display Name</label>
          <input id="set-display" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>

        <hr className="admin-form-divider" />

        <div className="admin-form-group">
          <label htmlFor="set-current">Current Password <span className="admin-form-hint">(required to save)</span></label>
          <PasswordInput id="set-current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>

        <div className="admin-form-group">
          <label htmlFor="set-password">New Password <span className="admin-form-hint">(leave blank to keep current)</span></label>
          <PasswordInput id="set-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn-primary">Save Changes</button>
      </form>
    </div>
  )
}

export default SettingsAdmin
