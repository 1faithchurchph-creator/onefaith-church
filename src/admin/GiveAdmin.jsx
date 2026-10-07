import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'
import { writeGiveContentCache } from '../lib/giveContent'
import '../css/admin-forms.css'
import '../css/give-admin.css'

const KEYS = [
  'give_hero_title',
  'give_verse_text',
  'give_verse_ref',
  'give_scan_note',
  'give_qr_codes',
  'give_cards',
  // Legacy keys kept only to migrate older saves into the new single JSON list.
  'give_card_1_icon',
  'give_card_1_title',
  'give_card_1_body',
  'give_card_2_icon',
  'give_card_2_title',
  'give_card_2_body',
  'give_card_3_icon',
  'give_card_3_title',
  'give_card_3_body',
]

const parseQrCodes = (raw) => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({ label: typeof x.label === 'string' ? x.label : '', image: typeof x.image === 'string' ? x.image : '' }))
    }
  } catch {
    // fall through
  }
  // Backwards compat: previously a single give_qr_image URL was stored.
  return raw && typeof raw === 'string' ? [{ label: '', image: raw }] : []
}

// `raw` is the JSON string from `give_cards`. `legacyRows` is the full {key, value}
// array returned from Supabase so we can migrate the old card_1/2/3 keys on first load.
const parseCards = (raw, legacyRows = []) => {
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((x) => x && typeof x === 'object')
          .map((x) => ({
            title: typeof x.title === 'string' ? x.title : '',
            body: typeof x.body === 'string' ? x.body : '',
          }))
      }
    } catch {
      // fall through
    }
  }

  // Backwards compat: previously cards 1-3 were stored as nine separate keys.
  const get = (k) => legacyRows.find((r) => r.key === k)?.value || ''
  const legacy = [1, 2, 3]
    .map((n) => ({
      title: get(`give_card_${n}_title`),
      body: get(`give_card_${n}_body`),
    }))
    .filter((c) => c.title || c.body)
  return legacy
}

const GiveAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [heroTitle, setHeroTitle] = useState('')
  const [verseText, setVerseText] = useState('')
  const [verseRef, setVerseRef] = useState('')
  const [scanNote, setScanNote] = useState('')

  const [qrCodes, setQrCodes] = useState([])
  // Pending file per index, set when admin picks a new upload for that slot.
  const [qrPending, setQrPending] = useState({})

  const [cards, setCards] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('give_content')
        .select('key, value')
        .in('key', KEYS)

      if (!error && data) {
        const get = (k) => data.find((r) => r.key === k)?.value || ''
        setHeroTitle(get('give_hero_title'))
        setVerseText(get('give_verse_text'))
        setVerseRef(get('give_verse_ref'))
        setScanNote(get('give_scan_note'))
        setQrCodes(parseQrCodes(get('give_qr_codes')))
        setCards(parseCards(get('give_cards'), data))
      }
      setLoading(false)
    }

    fetchContent()
  }, [])

  const uploadQrImage = async (file) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '')
    const filePath = `give/qr-${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('images').upload(filePath, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath)
    return publicUrl
  }

  const addQrCode = () => {
    setQrCodes((prev) => [...prev, { label: '', image: '' }])
  }

  const removeQrCode = (index) => {
    setQrCodes((prev) => prev.filter((_, i) => i !== index))
    setQrPending((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const updateQrLabel = (index, label) => {
    setQrCodes((prev) => prev.map((qr, i) => (i === index ? { ...qr, label } : qr)))
  }

  const setQrFileFor = (index, file) => {
    if (!file) return
    setQrPending((prev) => ({ ...prev, [index]: file }))
    setQrCodes((prev) =>
      prev.map((qr, i) =>
        i === index ? { ...qr, image: URL.createObjectURL(file) } : qr
      )
    )
  }

  const addCard = () => {
    setCards((prev) => [...prev, { title: '', body: '' }])
  }

  const removeCard = (index) => {
    setCards((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCard = (index, field, value) => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setToast(null)
    setSaving(true)

    try {
      // Upload any pending files; replace preview blob URLs with real public URLs.
      const finalQrCodes = [...qrCodes]
      for (const indexStr of Object.keys(qrPending)) {
        const index = Number(indexStr)
        const file = qrPending[index]
        if (file && finalQrCodes[index]) {
          const publicUrl = await uploadQrImage(file)
          finalQrCodes[index] = { ...finalQrCodes[index], image: publicUrl }
        }
      }
      const qrJson = JSON.stringify(finalQrCodes.filter((qr) => qr.image))

      // Cards are now stored as a single JSON list. Empty/whitespace-only
      // entries are dropped before save so the public page never renders a
      // blank card.
      const cleanedCards = cards
        .map((c) => ({
          title: c.title.trim(),
          body: c.body.trim(),
        }))
        .filter((c) => c.title || c.body)
      const cardsJson = JSON.stringify(cleanedCards)

      const now = new Date().toISOString()
      const rows = [
        { key: 'give_hero_title', value: heroTitle.trim() || 'Give', updated_at: now },
        { key: 'give_verse_text', value: verseText.trim() || '"God loves a cheerful giver."', updated_at: now },
        { key: 'give_verse_ref', value: verseRef.trim() || '2 Corinthians 9:7', updated_at: now },
        { key: 'give_scan_note', value: scanNote.trim() || 'Scan with GCash, Maya, or your bank app', updated_at: now },
        { key: 'give_qr_codes', value: qrJson, updated_at: now },
        { key: 'give_cards', value: cardsJson, updated_at: now },
        // Clear the legacy card_1/2/3 keys so they don't keep migrating back.
        { key: 'give_card_1_icon', value: '', updated_at: now },
        { key: 'give_card_1_title', value: '', updated_at: now },
        { key: 'give_card_1_body', value: '', updated_at: now },
        { key: 'give_card_2_icon', value: '', updated_at: now },
        { key: 'give_card_2_title', value: '', updated_at: now },
        { key: 'give_card_2_body', value: '', updated_at: now },
        { key: 'give_card_3_icon', value: '', updated_at: now },
        { key: 'give_card_3_title', value: '', updated_at: now },
        { key: 'give_card_3_body', value: '', updated_at: now },
      ]

      const { error } = await supabase.from('give_content').upsert(rows, { onConflict: 'key' })
      if (error) throw error

      writeGiveContentCache(rows)

      setQrCodes(finalQrCodes.filter((qr) => qr.image))
      setQrPending({})
      // Reflect any cards that were dropped during save (e.g. an empty new card
      // the admin added but didn't fill in).
      setCards(cleanedCards)
      setToast({ message: 'Give page content updated successfully.', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to save.', type: 'error' })
    }
    setSaving(false)
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Welcome, {user.display_name || 'Admin'}</h1>
      <p style={{ color: '#999', marginBottom: '1.5rem' }}>
        Manage the Give page — the verse, QR codes, and three "why your giving matters" cards shown to visitors.
      </p>

      <form onSubmit={handleSave} className="admin-form">
        {/* Section 1: Hero */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Hero</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>
          The big heading and Bible verse shown at the top of the Give page.
        </p>

        <div className="admin-form-group">
          <label htmlFor="hero-title">Page Title</label>
          <input
            id="hero-title"
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="Give"
            disabled={loading}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label htmlFor="verse-text">Verse Text</label>
            <input
              id="verse-text"
              type="text"
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              placeholder='"God loves a cheerful giver."'
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="verse-ref">Verse Reference</label>
            <input
              id="verse-ref"
              type="text"
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              placeholder="2 Corinthians 9:7"
              disabled={loading}
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label htmlFor="scan-note">Scan Note</label>
          <input
            id="scan-note"
            type="text"
            value={scanNote}
            onChange={(e) => setScanNote(e.target.value)}
            placeholder="Scan with GCash, Maya, or your bank app"
            disabled={loading}
          />
        </div>

        <hr className="admin-form-divider" />

        {/* Section 2: QR Codes */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>QR Codes</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>
          Add one QR per payment method (e.g. GCash, Maya, Bank). Each has a label and an image. Members see them side-by-side on the Give page.
        </p>

        <div className="give-qr-admin-list">
          {qrCodes.length === 0 && (
            <p className="give-qr-admin-empty">No QR codes yet — click "Add QR Code" below.</p>
          )}

          {qrCodes.map((qr, index) => (
            <div className="give-qr-admin-item" key={index}>
              <QrPicker
                index={index}
                label={qr.label}
                imageUrl={qr.image}
                onLabelChange={(val) => updateQrLabel(index, val)}
                onFileSelect={(file) => setQrFileFor(index, file)}
                loading={loading}
              />
              <button
                type="button"
                className="give-qr-admin-remove"
                onClick={() => removeQrCode(index)}
                disabled={loading || saving}
                aria-label={`Remove QR ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="give-qr-admin-add"
          onClick={addQrCode}
          disabled={loading || saving}
        >
          + Add QR Code
        </button>

        <hr className="admin-form-divider" />

        {/* Section 3: Cards */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Why Your Giving Matters — Cards</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>
          Cards shown below the QR.
          Start empty, click "Add Card" to add one, and use "Remove" to take a card off.
        </p>

        <div className="give-qr-admin-list">
          {cards.length === 0 && (
            <p className="give-qr-admin-empty">No cards yet — click "Add Card" below.</p>
          )}

          {cards.map((card, index) => (
            <div className="give-card-admin-item" key={index}>
              <CardEditor
                card={card}
                onChange={(field, value) => updateCard(index, field, value)}
                index={index}
                loading={loading}
              />
              <button
                type="button"
                className="give-qr-admin-remove"
                onClick={() => removeCard(index)}
                disabled={loading || saving}
                aria-label={`Remove card ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="give-qr-admin-add"
          onClick={addCard}
          disabled={loading || saving}
        >
          + Add Card
        </button>

        <button type="submit" className="btn-primary" disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

const CardEditor = ({ card, onChange, index, loading }) => {
  return (
    <div className="give-card-admin-fields">
      <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem', color: '#2596be' }}>Card {index + 1}</h3>

      <div className="admin-form-grid">
        <div className="admin-form-group">
          <label htmlFor={`card-${index}-title`}>Title</label>
          <input
            id={`card-${index}-title`}
            type="text"
            value={card.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Outreach"
            disabled={loading}
          />
        </div>
      </div>

      <div className="admin-form-group">
        <label htmlFor={`card-${index}-body`}>Body</label>
        <textarea
          id={`card-${index}-body`}
          value={card.body}
          onChange={(e) => onChange('body', e.target.value)}
          placeholder="Supporting families in need across our city."
          disabled={loading}
        />
      </div>
    </div>
  )
}

// Compact QR picker — small preview, label input, and file picker inline.
// Supports drag-and-drop on the preview square, in addition to click-to-browse.
const QrPicker = ({ index, label, imageUrl, onLabelChange, onFileSelect, loading }) => {
  const fileInput = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const acceptFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onFileSelect(file)
  }

  const handleFile = (e) => acceptFile(e.target.files?.[0])

  const onDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (loading) return
    acceptFile(e.dataTransfer.files?.[0])
  }

  const onDragOver = (e) => {
    e.preventDefault()
    if (!dragActive) setDragActive(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  return (
    <div className="give-qr-picker">
      <div
        className={`give-qr-picker__preview${dragActive ? ' is-drop-active' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !loading && fileInput.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !loading) {
            e.preventDefault()
            fileInput.current?.click()
          }
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={`QR ${index + 1}`} />
        ) : (
          <span className="give-qr-picker__hint">
            {dragActive ? 'Drop image here' : 'Tap or drag an image here'}
          </span>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleFile}
          hidden
        />
      </div>
      <div className="give-qr-picker__fields">
        <label className="give-qr-picker__label" htmlFor={`qr-${index}-label`}>
          Label
        </label>
        <input
          id={`qr-${index}-label`}
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="GCash / Maya / Bank"
          disabled={loading}
        />
      </div>
    </div>
  )
}

export default GiveAdmin
