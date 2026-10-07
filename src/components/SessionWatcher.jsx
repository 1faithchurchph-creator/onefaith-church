import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SessionWatcher = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.id) return

    const channel = supabase
      .channel('session-watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: '1faithauth', filter: `id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new
          if (!updated) return

          if (updated.blocked) {
            localStorage.removeItem('user')
            navigate('/admin', { replace: true })
            return
          }

          const stored = JSON.parse(localStorage.getItem('user') || '{}')
          localStorage.setItem('user', JSON.stringify({ ...stored, ...updated }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: '1faithauth', filter: `id=eq.${user.id}` },
        () => {
          localStorage.removeItem('user')
          navigate('/admin', { replace: true })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, navigate])

  return null
}

export default SessionWatcher
