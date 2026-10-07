import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MONTHS } from '../lib/calendar'
import Toast from '../components/Toast'
import '../css/admin-forms.css'
import '../css/calendar.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialsOf = (name) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

const fmtDate = (key) => {
  if (!key) return null
  const d = new Date(`${key}T00:00:00`)
  if (Number.isNaN(d.getTime())) return key
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


const daysInMonth = (year, month) => new Date(year, month, 0).getDate()

// Month / day / year dropdowns for a birthday. Value is a `YYYY-MM-DD` string
// (or '' when incomplete); onChange returns the same format.
const DateSelects = ({ value, onChange }) => {
  const currentYear = new Date().getFullYear()
  const years = useMemo(() => {
    const out = []
    for (let y = currentYear; y >= currentYear - 110; y--) out.push(y)
    return out
  }, [currentYear])

  const parts = value ? value.split('-') : []
  const [year, setYear] = useState(parts[0] || '')
  const [month, setMonth] = useState(parts[1] ? String(Number(parts[1])) : '')
  const [day, setDay] = useState(parts[2] ? String(Number(parts[2])) : '')

  const maxDay = year && month ? daysInMonth(Number(year), Number(month)) : 31
  const days = []
  for (let d = 1; d <= maxDay; d++) days.push(d)

  const build = (ny, nm, nd) => {
    if (!ny || !nm || !nd) return ''
    const cday = Math.min(nd, daysInMonth(ny, nm))
    return `${ny}-${String(nm).padStart(2, '0')}-${String(cday).padStart(2, '0')}`
  }

  // Each dropdown keeps its own value locally so a partial selection (e.g.
  // only the month) stays visible instead of snapping back to blank.
  const setPart = (part, raw) => {
    let ny = year
    let nm = month
    let nd = day
    if (part === 'year') ny = raw
    if (part === 'month') nm = raw
    if (part === 'day') nd = raw
    if (nm && ny && nd) {
      const max = daysInMonth(Number(ny), Number(nm))
      if (Number(nd) > max) nd = max
    }
    if (part === 'year') setYear(raw)
    if (part === 'month') setMonth(raw)
    if (part === 'day') setDay(raw)
    onChange(build(Number(ny), Number(nm), Number(nd)))
  }

  return (
    <div className="date-selects">
      <select
        className="date-select date-select--month"
        value={month}
        aria-label="Month"
        onChange={(e) => setPart('month', e.target.value)}
      >
        <option value="">Month</option>
        {MONTHS.map((mn, i) => (
          <option key={mn} value={i + 1}>{mn}</option>
        ))}
      </select>
      <select
        className="date-select date-select--day"
        value={day}
        aria-label="Day"
        onChange={(e) => setPart('day', e.target.value)}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        className="date-select date-select--year"
        value={year}
        aria-label="Year"
        onChange={(e) => setPart('year', e.target.value)}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

const isGmailEmail = (email) => (email || '').trim().toLowerCase().endsWith('@gmail.com')

const inviteStatusOf = (member) => {
  if (member.consent_granted_at) return { text: 'Consented', cls: 'ok' }
  if (member.invite_sent_at) return { text: 'Invite sent', cls: 'info' }
  return { text: 'Not invited', cls: 'muted' }
}

const MemberCard = ({ member, saving, deleteId, inviteSendingId, onEdit, onAskDelete, onKeep, onDelete, onResendInvite }) => {
  const gmail = isGmailEmail(member.email)
  const status = gmail ? inviteStatusOf(member) : null
  return (
    <div className="member-card">
      <div className="member-card__top">
        {member.avatar_url ? (
          <img className="member-card__avatar" src={member.avatar_url} alt={member.name} />
        ) : (
          <div className="member-card__avatar member-card__avatar--initials">{initialsOf(member.name)}</div>
        )}
        <div className="member-card__body">
          <p className="member-card__name">{member.name}</p>
          <p className="member-card__email">{member.email}</p>
        </div>
      </div>

      <div className="member-card__meta">
        {member.physical_birthday ? (
          <span>Birthday: <strong>{fmtDate(member.physical_birthday)}</strong></span>
        ) : (
          <span>Birthday: <strong>Not set</strong></span>
        )}
        {member.spiritual_birthday ? (
          <span>Spiritual birthday: <strong>{fmtDate(member.spiritual_birthday)}</strong></span>
        ) : (
          <span>Spiritual birthday: <strong>Not set</strong></span>
        )}
      </div>

      <div className="member-card__actions">
        {gmail && (
          <div className="member-card__actions-row">
            <span className={`member-card__status member-card__status--${status.cls}`}>{status.text}</span>
            <button
              type="button"
              className="admin-cal-btn admin-cal-btn--edit"
              disabled={saving || inviteSendingId === member.id}
              onClick={() => onResendInvite(member)}
            >
              {inviteSendingId === member.id ? 'Sending…' : 'Resend Invite'}
            </button>
          </div>
        )}

        <div className="member-card__actions-row">
          <button type="button" className="admin-cal-btn admin-cal-btn--edit" onClick={() => onEdit(member)}>
            Edit
          </button>
          {deleteId === member.id ? (
            <>
              <button type="button" className="admin-cal-btn admin-cal-btn--confirm" disabled={saving} onClick={() => onDelete(member.id)}>
                Confirm?
              </button>
              <button type="button" className="admin-cal-btn admin-cal-btn--cancel" disabled={saving} onClick={onKeep}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="admin-cal-btn admin-cal-btn--delete" onClick={() => onAskDelete(member.id)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const emptyForm = () => ({
  name: '',
  email: '',
  spiritual_birthday: '',
  physical_birthday: '',
})

const MembersAdmin = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarDragging, setAvatarDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [inviteSendingId, setInviteSendingId] = useState(null)
  const [toast, setToast] = useState(null)

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('ministry_members')
      .select('*')
      .order('name', { ascending: true })
    if (!error && data) setMembers(data)
  }

  useEffect(() => {
    let active = true
    supabase
      .from('ministry_members')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data) setMembers(data)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    setAvatarUrl('')
    setAvatarFile(null)
    setAvatarPreview('')
    setFormOpen(true)
  }

  const openEdit = (m) => {
    setEditingId(m.id)
    setForm({
      name: m.name || '',
      email: m.email || '',
      spiritual_birthday: m.spiritual_birthday || '',
      physical_birthday: m.physical_birthday || '',
    })
    setAvatarUrl(m.avatar_url || '')
    setAvatarFile(null)
    setAvatarPreview('')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const setField = (key) => (ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))

  const acceptAvatarFile = (selected) => {
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      setToast({ message: 'Please choose an image file.', type: 'error' })
      return
    }
    setAvatarFile(selected)
    setAvatarPreview(URL.createObjectURL(selected))
  }

  const handleAvatarFile = (e) => acceptAvatarFile(e.target.files?.[0])

  const handleAvatarDrop = (e) => {
    e.preventDefault()
    acceptAvatarFile(e.dataTransfer.files?.[0])
  }

  const sendInvite = async (id, name, email) => {
    const { error } = await supabase.functions.invoke('send-invite', { body: { memberId: id, name, email } })
    if (error) throw error
  }

  const resendInvite = async (m) => {
    setInviteSendingId(m.id)
    try {
      await sendInvite(m.id, m.name, m.email)
      setToast({ message: 'Invitation sent.', type: 'success' })
      await loadMembers()
    } catch (err) {
      setToast({ message: err.message || 'Failed to send invitation.', type: 'error' })
    }
    setInviteSendingId(null)
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!form.name.trim()) {
      setToast({ message: 'Name is required.', type: 'error' })
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setToast({ message: 'Enter a valid email address.', type: 'error' })
      return
    }
    if (!form.physical_birthday) {
      setToast({ message: 'Physical birthday is required.', type: 'error' })
      return
    }
    if (!form.spiritual_birthday) {
      setToast({ message: 'Spiritual birthday is required.', type: 'error' })
      return
    }

    setSaving(true)
    try {
      let avatar = avatarUrl
      if (avatarFile) {
        const safeName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '')
        const filePath = `members/${Date.now()}-${safeName}`
        const { error: upErr } = await supabase.storage.from('images').upload(filePath, avatarFile, { upsert: true })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath)
        avatar = publicUrl
      }

      const row = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        spiritual_birthday: form.spiritual_birthday || null,
        physical_birthday: form.physical_birthday || null,
        avatar_url: avatar || null,
      }

      if (editingId) {
        const { error } = await supabase.from('ministry_members').update(row).eq('id', editingId)
        if (error) throw error
        setToast({ message: 'Member updated.', type: 'success' })
      } else {
        const { data: inserted, error } = await supabase.from('ministry_members').insert(row).select().single()
        if (error) throw error
        if (isGmailEmail(row.email)) {
          try {
            await sendInvite(inserted.id, inserted.name, inserted.email)
            setToast({ message: 'Member added. Invitation sent to their email.', type: 'success' })
          } catch {
            setToast({ message: 'Member added, but the invitation email failed to send.', type: 'error' })
          }
        } else {
          setToast({ message: 'Member added.', type: 'success' })
        }
      }
      closeForm()
      await loadMembers()
    } catch (err) {
      setToast({ message: err.message || 'Failed to save member.', type: 'error' })
    }
    setSaving(false)
  }

  const confirmDelete = async (id) => {
    setSaving(true)
    try {
      const { error } = await supabase.from('ministry_members').delete().eq('id', id)
      if (error) throw error
      setToast({ message: 'Member removed.', type: 'success' })
      setDeleteId(null)
      await loadMembers()
    } catch (err) {
      setToast({ message: err.message || 'Delete failed.', type: 'error' })
      setDeleteId(null)
    }
    setSaving(false)
  }

  const avatarSrc = avatarPreview || avatarUrl

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="admin-members-top">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Ministry Members</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#999', maxWidth: '46rem' }}>
            Manage the church member list. Members added with a Gmail address receive an email invitation to give calendar permission. Events are added to the shared church Google Calendar from the Manage Calendar page, and anyone who subscribes gets them automatically.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openAdd} disabled={saving}>
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          Loading members…
        </div>
      ) : members.length === 0 ? (
        <p style={{ color: '#7a9bad' }}>No members yet. Add the first one.</p>
      ) : (
        <div className="member-grid">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              saving={saving}
              deleteId={deleteId}
              inviteSendingId={inviteSendingId}
              onEdit={openEdit}
              onAskDelete={setDeleteId}
              onKeep={() => setDeleteId(null)}
              onDelete={confirmDelete}
              onResendInvite={resendInvite}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={closeForm}>
          <form className="modal admin-member-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal__header">
              <h3 className="modal__title">{editingId ? 'Edit Member' : 'Add Member'}</h3>
              <button type="button" className="modal__close" aria-label="Close" onClick={closeForm}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-member-form__body">
              <div className="admin-member-form__main">
                <div className="admin-member-form__avatar">
                  <label
                    className={`image-upload-box member-avatar-box${avatarDragging ? ' image-upload-box--dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setAvatarDragging(true)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) setAvatarDragging(false)
                    }}
                    onDrop={handleAvatarDrop}
                  >
                    <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Member avatar" />
                    ) : (
                      <span className="image-upload-hint">Photo — tap or drag & drop</span>
                    )}
                  </label>
                  <p className="image-upload-note">{avatarFile ? avatarFile.name : ''}</p>
                </div>

                <div className="admin-member-form__fields">
                  <div className="admin-form-group">
                    <label htmlFor="member-name">
                      Name <span className="admin-form-hint">(required)</span>
                    </label>
                    <input id="member-name" type="text" value={form.name} onChange={setField('name')} placeholder="e.g. Juan Dela Cruz" />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="member-email">
                      Email <span className="admin-form-hint">(required)</span>
                    </label>
                    <input id="member-email" type="email" value={form.email} onChange={setField('email')} placeholder="member@email.com" />
                  </div>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>
                    Physical Birthday <span className="admin-form-hint">(required)</span>
                  </label>
                  <DateSelects value={form.physical_birthday} onChange={(v) => setForm((f) => ({ ...f, physical_birthday: v }))} />
                </div>
                <div className="admin-form-group">
                  <label>
                    Spiritual Birthday <span className="admin-form-hint">(required)</span>
                  </label>
                  <DateSelects value={form.spiritual_birthday} onChange={(v) => setForm((f) => ({ ...f, spiritual_birthday: v }))} />
                </div>
              </div>
            </div>
            <div className="admin-cal-form__footer">
              <button type="button" className="admin-cal-btn admin-cal-btn--cancel" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MembersAdmin