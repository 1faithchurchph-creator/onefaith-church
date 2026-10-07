import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'
import '../css/admin-forms.css'

const AdminPanel = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('1faithauth')
      .select('id, username, display_name, is_admin, blocked, is_logged_in, created_at')
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()

    const channel = supabase
      .channel('admin-panel-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: '1faithauth' },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleBlockToggle = async (user) => {
    const newStatus = !user.blocked
    const updates = { blocked: newStatus }
    if (newStatus) updates.is_logged_in = false

    const { error } = await supabase
      .from('1faithauth')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setToast({ message: `${user.username} ${newStatus ? 'blocked' : 'unblocked'}.`, type: 'success' })
      fetchUsers()
    }
  }

  const handleRoleToggle = async (user) => {
    const newRole = !user.is_admin

    const { error } = await supabase
      .from('1faithauth')
      .update({ is_admin: newRole })
      .eq('id', user.id)

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setToast({ message: `${user.username} is now ${newRole ? 'an admin' : 'a staff member'}.`, type: 'success' })
      fetchUsers()
    }
  }

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return

    const { error } = await supabase
      .from('1faithauth')
      .delete()
      .eq('id', id)

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setToast({ message: `"${username}" deleted permanently.`, type: 'success' })
      fetchUsers()
    }
  }

  if (loading) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
        Loading...
      </div>
    )
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Admin Panel</h1>
      <p style={{ color: '#999', marginBottom: '1rem' }}>Manage all user accounts. Block prevents login, delete removes permanently.</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
            <th style={{ padding: '0.75rem 0.6rem', color: '#555' }}>Username</th>
            <th style={{ padding: '0.75rem 0.6rem', color: '#555' }}>Display Name</th>
            <th style={{ padding: '0.75rem 0.6rem', color: '#555' }}>Role</th>
            <th style={{ padding: '0.75rem 0.6rem', color: '#555' }}>Status</th>
            <th style={{ padding: '0.75rem 0.6rem', color: '#555' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUser.id
            const status = u.blocked
              ? { label: 'Blocked', color: '#e74c3c' }
              : u.is_logged_in
                ? { label: 'Active', color: '#10de55' }
                : { label: 'Inactive', color: '#999' }

            return (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem 0.6rem' }}>{u.username}</td>
                <td style={{ padding: '0.75rem 0.6rem' }}>{u.display_name}</td>
                <td style={{ padding: '0.75rem 0.6rem' }}>{u.is_admin ? 'Admin' : 'Staff'}</td>
                <td style={{ padding: '0.75rem 0.6rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      display: 'inline-block',
                      background: status.color,
                    }} />
                    {status.label}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 0.6rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleRoleToggle(u)}
                    className="btn-sm"
                    disabled={isSelf}
                    style={{
                      background: u.is_admin ? '#6b5b95' : '#2596be',
                      color: '#fff',
                      opacity: isSelf ? 0.35 : 1,
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                    }}
                    title={isSelf ? "You can't change your own role" : ''}
                  >
                    {u.is_admin ? 'Make Staff' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => handleBlockToggle(u)}
                    className="btn-sm"
                    disabled={isSelf}
                    style={{
                      background: u.blocked ? '#10de55' : '#e67e22',
                      color: '#fff',
                      opacity: isSelf ? 0.35 : 1,
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                    }}
                    title={isSelf ? "You can't block your own account" : ''}
                  >
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    className="btn-sm"
                    disabled={isSelf}
                    style={{
                      background: '#e74c3c',
                      color: '#fff',
                      opacity: isSelf ? 0.35 : 1,
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                    }}
                    title={isSelf ? "You can't delete your own account" : ''}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {users.length === 0 && <p style={{ marginTop: '1rem', color: '#999' }}>No users found.</p>}
    </div>
  )
}

export default AdminPanel
