import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toEmbedUrl } from '../lib/youtube'
import Toast from '../components/Toast'
import { writeSermonsContentCache } from '../lib/sermonsContent'
import '../css/admin-forms.css'

const KEYS = [
  'sermons_title',
  'sermons_subheading',
  'sermons_youtube_link',
]

const SermonsAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [title, setTitle] = useState('')
  const [subheading, setSubheading] = useState('')
  const [youtubeLink, setYoutubeLink] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('sermons_content')
        .select('key, value')
        .in('key', KEYS)

      if (!error && data) {
        const get = (k) => data.find((r) => r.key === k)?.value || ''
        setTitle(get('sermons_title'))
        setSubheading(get('sermons_subheading'))
        setYoutubeLink(get('sermons_youtube_link'))
      }
      setLoading(false)
    }

    fetchContent()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setToast(null)
    setSaving(true)

    try {
      if (youtubeLink.trim()) {
        const embed = toEmbedUrl(youtubeLink)
        if (!embed) {
          setToast({ message: 'Invalid YouTube link. Use a youtube.com or youtu.be URL.', type: 'error' })
          setSaving(false)
          return
        }
      }

      const now = new Date().toISOString()
      const rows = [
        { key: 'sermons_title', value: title.trim() || 'Sermons', updated_at: now },
        { key: 'sermons_subheading', value: subheading.trim() || '', updated_at: now },
        { key: 'sermons_youtube_link', value: youtubeLink.trim(), updated_at: now },
      ]

      const { error } = await supabase.from('sermons_content').upsert(rows, { onConflict: 'key' })
      if (error) throw error

      writeSermonsContentCache(rows)
      setToast({ message: 'Sermons content updated successfully.', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to save.', type: 'error' })
    }
    setSaving(false)
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Welcome, {user.display_name || 'Admin'}</h1>
      <p style={{ color: '#999', marginBottom: '1.5rem' }}>Manage the sermons page content from here.</p>

      <form onSubmit={handleSave} className="admin-form">
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Sermon Details</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Set the title, subheading, and the YouTube video to be featured on the Sermons page.</p>

        <div className="home-admin-row">
          <div className="home-admin-preview">
            {youtubeLink && toEmbedUrl(youtubeLink) ? (
              <iframe
                src={toEmbedUrl(youtubeLink)}
                title={title || 'Sermon preview'}
                style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 8 }}
                allowFullScreen
              />
            ) : (
              <div className="home-admin-placeholder">Video preview appears here</div>
            )}
          </div>

          <div className="home-admin-fields">
            <div className="admin-form-group">
              <label htmlFor="sermons-title">Title</label>
              <input
                id="sermons-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly Sermons"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="sermons-subheading">Subheading</label>
              <textarea
                id="sermons-subheading"
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder="Watch our latest teachings and messages"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="sermons-link">YouTube Link</label>
              <input
                id="sermons-link"
                type="text"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

export default SermonsAdmin
