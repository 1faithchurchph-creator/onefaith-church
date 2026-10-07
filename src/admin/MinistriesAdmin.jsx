import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'
import { writeMinistryContentCache } from '../lib/ministryContent'
import '../css/admin-forms.css'

const KEYS = [
  'ministry_1_kicker',
  'ministry_1_title',
  'ministry_1_text',
  'ministry_1_image',
  'ministry_2_kicker',
  'ministry_2_title',
  'ministry_2_text',
  'ministry_2_image',
  'ministry_3_kicker',
  'ministry_3_title',
  'ministry_3_text',
  'ministry_3_image',
  'ministry_4_kicker',
  'ministry_4_title',
  'ministry_4_text',
  'ministry_4_image',
]

const BLOCKS = [
  { n: 1, orientation: 'image left · text right' },
  { n: 2, orientation: 'image right · text left' },
  { n: 3, orientation: 'image left · text right' },
  { n: 4, orientation: 'image right · text left' },
]

const MinistriesAdmin = () => {
  const [kickers, setKickers] = useState(['', '', '', ''])
  const [titles, setTitles] = useState(['', '', '', ''])
  const [texts, setTexts] = useState(['', '', '', ''])
  const [imageUrls, setImageUrls] = useState(['', '', '', ''])
  const [files, setFiles] = useState([null, null, null, null])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('ministries_content')
        .select('key, value')
        .in('key', KEYS)

      if (!error && data) {
        const get = (k) => data.find((r) => r.key === k)?.value || ''
        const byN = (field, n) => get(`ministry_${n}_${field}`)
        setKickers([1, 2, 3, 4].map((n) => byN('kicker', n)))
        setTitles([1, 2, 3, 4].map((n) => byN('title', n)))
        setTexts([1, 2, 3, 4].map((n) => byN('text', n)))
        setImageUrls([1, 2, 3, 4].map((n) => byN('image', n)))
      }
      setLoading(false)
    }

    fetchContent()
  }, [])

  // Downscale to ~1600px wide and re-encode as WebP (JPEG fallback) so the
  // block (shown at ~550px wide) never downloads a multi-MB original.
  const compressImage = async (file) => {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      const objectUrl = URL.createObjectURL(file)
      image.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(image)
      }
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not read the image file.'))
      }
      image.src = objectUrl
    })

    const MAX_WIDTH = 1600
    const scale = Math.min(1, MAX_WIDTH / img.naturalWidth)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)

    const webpSupported = document.createElement('canvas').toDataURL('image/webp').indexOf('image/webp') === 0
    // PNG may carry transparency; keep it untouched only where WebP isn't available.
    if (!webpSupported && file.type === 'image/png') return file

    const mime = webpSupported ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.82))
    if (!blob) throw new Error('Could not compress the image.')

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}${webpSupported ? '.webp' : '.jpg'}`, { type: blob.type })
  }

  const uploadImage = async (file, slot) => {
    const compressed = await compressImage(file)
    const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, '')
    const filePath = `ministries/${slot}-${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('images').upload(filePath, compressed, {
      upsert: true,
      contentType: compressed.type,
    })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath)
    return publicUrl
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setToast(null)
    setSaving(true)

    try {
      const urls = [...imageUrls]
      for (let i = 0; i < files.length; i++) {
        if (files[i]) urls[i] = await uploadImage(files[i], `block-${i + 1}`)
      }

      const now = new Date().toISOString()
      const rows = []
      for (let i = 0; i < 4; i++) {
        const n = i + 1
        rows.push({ key: `ministry_${n}_kicker`, value: kickers[i].trim(), updated_at: now })
        rows.push({ key: `ministry_${n}_title`, value: titles[i].trim(), updated_at: now })
        rows.push({ key: `ministry_${n}_text`, value: texts[i].trim(), updated_at: now })
        rows.push({ key: `ministry_${n}_image`, value: urls[i], updated_at: now })
      }

      const { error } = await supabase.from('ministries_content').upsert(rows, { onConflict: 'key' })
      if (error) throw error

      writeMinistryContentCache(rows)

      setImageUrls(urls)
      setFiles([null, null, null, null])
      setToast({ message: 'Ministry content updated successfully.', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to save.', type: 'error' })
    }
    setSaving(false)
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Manage Ministries</h1>
      <p style={{ color: '#999', margin: '0 0 1.5rem' }}>
        Edit the four blocks shown on the /ministries page. Orientation alternates automatically on
        the live page: blocks 1 &amp; 3 have the photo on the left, blocks 2 &amp; 4 on the right.
      </p>

      <form className="admin-form" onSubmit={handleSave}>
        {BLOCKS.map((b, i) => (
          <div key={b.n}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
              Block {b.n} <span style={{ fontWeight: 400, color: '#999' }}>({b.orientation})</span>
            </h2>
            <p style={{ color: '#999', margin: '0 0 1rem' }}>
              Sub-header sits above the photo; the title and body text sit on the opposite side.
            </p>

            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor={`block-${b.n}-kicker`}>Sub-Header</label>
                <input
                  id={`block-${b.n}-kicker`}
                  type="text"
                  value={kickers[i]}
                  onChange={(e) => setKickers((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                  placeholder="e.g. Youth Ministry"
                  disabled={loading}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor={`block-${b.n}-title`}>Title</label>
                <input
                  id={`block-${b.n}-title`}
                  type="text"
                  value={titles[i]}
                  onChange={(e) => setTitles((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                  placeholder="e.g. Growing Together in Faith"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor={`block-${b.n}-text`}>
                Body Text <span className="admin-form-hint">(start a new line for each paragraph)</span>
              </label>
              <textarea
                id={`block-${b.n}-text`}
                value={texts[i]}
                onChange={(e) => setTexts((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder="Write the ministry description here…"
                disabled={loading}
              />
            </div>

            <div className="home-admin-images home-admin-images--four">
              <ImagePicker
                label="Landscape Photo"
                imageUrl={imageUrls[i]}
                file={files[i]}
                setFile={(f) => setFiles((arr) => arr.map((x, idx) => (idx === i ? f : x)))}
              />
            </div>

            <hr className="admin-form-divider" />
          </div>
        ))}

        <button type="submit" className="btn-primary" disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

const ImagePicker = ({ label, buttonLabel, imageUrl, file, setFile }) => {
  const [preview, setPreview] = useState('')
  const [dragging, setDragging] = useState(false)

  const acceptFile = (selected) => {
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      setFile(null)
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleFile = (e) => acceptFile(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const src = preview || imageUrl

  return (
    <div className="home-admin-image-card">
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.6rem', color: '#555' }}>{label}</h3>
      <label
        className={`image-upload-box${dragging ? ' image-upload-box--dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
        }}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" onChange={handleFile} hidden />
        {src ? (
          <img src={src} alt={label} />
        ) : (
          <span className="image-upload-hint">Tap to choose, or drag &amp; drop an image here</span>
        )}
      </label>
      <p className="image-upload-note">{file ? `${file.name} (pending upload)` : ''}</p>
      <p className="image-button-label">{buttonLabel}</p>
    </div>
  )
}

export default MinistriesAdmin