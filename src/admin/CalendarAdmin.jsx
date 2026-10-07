import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'
import { WEEKDAYS, MONTHS, dateKey, parseDateKey, formatTime, expandDates, dateRangeLabel } from '../lib/calendar'
import '../css/admin-forms.css'
import '../css/calendar.css'

const emptyForm = () => ({
  title: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
})

const EventRow = ({ event, saving, deleteId, highlighted, onEdit, onAskDelete, onKeep, onDelete }) => {
  const start = parseDateKey(event.event_date)
  const range = dateRangeLabel(event.event_date, event.end_date || event.event_date)
  const timeLabel = event.start_time
    ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ''}`
    : 'All day'

  return (
    <div className={['admin-cal-row', highlighted ? 'admin-cal-row--highlighted' : ''].filter(Boolean).join(' ')}>
      <div className="admin-cal-row__date">
        <span className="admin-cal-row__day">{start.getDate()}</span>
        <span className="admin-cal-row__month">{MONTHS[start.getMonth()].slice(0, 3)}</span>
      </div>
      <div className="admin-cal-row__body">
        <p className="admin-cal-row__title">{event.title}</p>
        <p className="admin-cal-row__meta">
          {range} • {timeLabel}
          {event.location ? ` • ${event.location}` : ''}
        </p>
      </div>
      <div className="admin-cal-row__actions">
        <button type="button" className="admin-cal-btn admin-cal-btn--edit" onClick={() => onEdit(event)}>
          Edit
        </button>
        {deleteId === event.id ? (
          <>
            <button type="button" className="admin-cal-btn admin-cal-btn--confirm" disabled={saving} onClick={() => onDelete(event.id)}>
              Confirm?
            </button>
            <button type="button" className="admin-cal-btn admin-cal-btn--cancel" disabled={saving} onClick={onKeep}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="admin-cal-btn admin-cal-btn--delete" onClick={() => onAskDelete(event.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

const HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
const MINUTE_STEPS = ['00', '10', '20', '30', '40', '50']

const TimeStepField = ({ id, value, onChange }) => {
  const parsed = value ? value.split(':').map(Number) : null
  const hour = parsed ? String((parsed[0] % 12) || 12) : '12'
  const minute = parsed ? String(parsed[1]).padStart(2, '0') : '00'
  const period = parsed ? (parsed[0] >= 12 ? 'PM' : 'AM') : 'AM'

  const build = (h, m, p) => {
    let hh = Number(h) % 12
    if (p === 'PM') hh += 12
    return `${String(hh).padStart(2, '0')}:${m}`
  }

  return (
    <div className="time-step-field">
      <select id={id} className="time-step-select" value={hour} onChange={(e) => onChange(build(e.target.value, minute, period))}>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="time-step-colon">:</span>
      <select className="time-step-select" value={minute} onChange={(e) => onChange(build(hour, e.target.value, period))}>
        {MINUTE_STEPS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select className="time-step-select time-step-select--ampm" value={period} onChange={(e) => onChange(build(hour, minute, e.target.value))}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

const CalendarAdmin = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const today = new Date(currentYear, currentMonth, now.getDate())
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState(todayKey)
  const [mode, setMode] = useState('upcoming')
  const [pastMonth, setPastMonth] = useState(currentMonth)
  const [pastYear, setPastYear] = useState(currentYear)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)
  const [syncingAll, setSyncingAll] = useState(false)

  const calendarPanelRef = useRef(null)
  const upcomingPanelRef = useRef(null)
  const upcomingListRef = useRef(null)

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: true })
    if (!error && data) setEvents(data)
  }

  useEffect(() => {
    let active = true
    supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: true })
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data) setEvents(data)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const cal = calendarPanelRef.current
    const up = upcomingPanelRef.current
    if (!cal || !up) return
    const ro = new ResizeObserver(() => {
      up.style.height = `${cal.offsetHeight}px`
    })
    ro.observe(cal)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const list = upcomingListRef.current
    if (!list) return
    const el = list.querySelector('.admin-cal-row--highlighted')
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedDay])

  const byDate = useMemo(() => {
    const map = {}
    for (const e of events) {
      for (const k of expandDates(e.event_date, e.end_date)) {
        if (!map[k]) map[k] = []
        map[k].push(e)
      }
    }
    return map
  }, [events])

  const upcoming = events
    .filter((e) => (e.end_date || e.event_date) >= todayKey)
    .sort((a, b) => {
      if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1
      return (a.start_time || '').localeCompare(b.start_time || '')
    })

  const isInRange = (e, key) => key >= e.event_date && key <= (e.end_date || e.event_date)

  const minPastYear = useMemo(() => {
    let min = currentYear
    for (const e of events) {
      if ((e.end_date || e.event_date) >= todayKey) continue
      const [y] = e.event_date.split('-').map(Number)
      if (y < min) min = y
    }
    return min
  }, [events, todayKey, currentYear])

  const pastYearOptions = useMemo(() => {
    const years = []
    for (let y = currentYear; y >= minPastYear; y--) {
      years.push(y)
    }
    return years
  }, [currentYear, minPastYear])

  const latestPastMonth = useMemo(() => {
    let best = null
    for (const e of events) {
      if ((e.end_date || e.event_date) >= todayKey) continue
      if (!best || e.event_date > best.event_date) best = e
    }
    if (!best) return { year: currentYear, month: currentMonth }
    const [y, m] = best.event_date.split('-').map(Number)
    return { year: y, month: m - 1 }
  }, [events, todayKey, currentYear, currentMonth])

  const pastEvents = useMemo(() => {
    const startKey = `${pastYear}-${String(pastMonth + 1).padStart(2, '0')}-01`
    const endKey = `${pastYear}-${String(pastMonth + 1).padStart(2, '0')}-31`
    return events
      .filter((e) => e.event_date < todayKey && e.event_date >= startKey && e.event_date <= endKey)
      .sort((a, b) => {
        if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1
        return (a.start_time || '').localeCompare(b.start_time || '')
      })
  }, [events, pastMonth, pastYear, todayKey])

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const pastPrevMonth = () => {
    let y = pastYear
    let m = pastMonth
    if (m === 0) {
      y -= 1
      m = 11
    } else {
      m -= 1
    }
    if (y < minPastYear) return
    setPastYear(y)
    setPastMonth(m)
  }

  const pastNextMonth = () => {
    let y = pastYear
    let m = pastMonth
    if (m === 11) {
      y += 1
      m = 0
    } else {
      m += 1
    }
    if (y > currentYear || (y === currentYear && m > currentMonth)) return
    setPastYear(y)
    setPastMonth(m)
  }

  const showPast = () => {
    setMode('past')
    if (selectedDay < todayKey) {
      const [y, m] = selectedDay.split('-').map(Number)
      setPastYear(y)
      setPastMonth(m - 1)
    } else {
      setPastYear(latestPastMonth.year)
      setPastMonth(latestPastMonth.month)
    }
  }

  const cells = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(<div key={`blank-${i}`} className="calendar__day calendar__day--blank" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(viewYear, viewMonth, day)
    const has = (byDate[key] || []).length > 0
    cells.push(
      <button
        type="button"
        key={key}
        className={[
          'calendar__day',
          key === todayKey ? 'calendar__day--today' : '',
          key === selectedDay ? 'calendar__day--selected' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          setSelectedDay(key)
          if (key < todayKey) {
            const [y, m] = key.split('-').map(Number)
            setMode('past')
            setPastYear(y)
            setPastMonth(m - 1)
          } else {
            setMode('upcoming')
          }
        }}
        aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
      >
        <span className="calendar__day-num">{day}</span>
        {has && <span className={['calendar__dot', key < todayKey ? 'calendar__dot--past' : ''].filter(Boolean).join(' ')} />}
      </button>
    )
  }
  for (let i = firstWeekday + daysInMonth; i < 42; i++) {
    cells.push(<div key={`trail-${i}`} className="calendar__day calendar__day--blank" />)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (e) => {
    setEditingId(e.id)
    setForm({
      title: e.title || '',
      startDate: e.event_date || '',
      endDate: e.end_date || '',
      startTime: (e.start_time || '').slice(0, 5),
      endTime: (e.end_time || '').slice(0, 5),
      location: e.location || '',
      description: e.description || '',
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const setField = (key) => (ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))

  const setStartDate = (ev) => {
    const value = ev.target.value
    setForm((f) => ({ ...f, startDate: value, endDate: value }))
  }

  const setFieldTime = (key) => (v) => setForm((f) => ({ ...f, [key]: v }))

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!form.title.trim()) {
      setToast({ message: 'Title is required.', type: 'error' })
      return
    }
    if (!form.startDate) {
      setToast({ message: 'Start date is required.', type: 'error' })
      return
    }
    if (!editingId && form.startDate < todayKey) {
      setToast({ message: 'Start date cannot be in the past.', type: 'error' })
      return
    }
    if (form.endDate && form.endDate < form.startDate) {
      setToast({ message: 'End date must be on or after the start date.', type: 'error' })
      return
    }

    const row = {
      title: form.title.trim(),
      event_date: form.startDate,
      end_date: form.endDate || form.startDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    }

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase.from('calendar_events').update(row).eq('id', editingId)
        if (error) throw error
        closeForm()
        setSelectedDay(row.event_date)
        await loadEvents()
        fireSync({ action: 'update', event: { id: editingId, ...row } }, 'Event updated.')
      } else {
        const { data: inserted, error } = await supabase.from('calendar_events').insert(row).select().single()
        if (error) throw error
        closeForm()
        setSelectedDay(row.event_date)
        await loadEvents()
        fireSync({ action: 'insert', event: { id: inserted.id, ...row } }, 'Event added.')
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to save event.', type: 'error' })
    }
    setSaving(false)
  }

  // Fire-and-forget: push a saved event to the shared church Google Calendar.
  // Never blocks the save — failures keep the event in the DB and just toast.
  const fireSync = async (payload, savedMsg) => {
    try {
      const { error } = await supabase.functions.invoke('calendar-sync', { body: payload })
      setToast(
        error
          ? { message: `${savedMsg} Calendar sync pending (${error.message}).`, type: 'success' }
          : { message: `${savedMsg} Synced to the church calendar.`, type: 'success' },
      )
    } catch {
      setToast({ message: `${savedMsg} Calendar sync pending.`, type: 'success' })
    }
  }

  // Push every saved event onto the shared Google Calendar. Use this once to
  // backfill events that existed in the database before syncing was set up.
  const syncAllToGoogle = async () => {
    if (syncingAll) return
    setSyncingAll(true)
    let ok = 0
    let firstErr = null
    try {
      for (const e of upcoming) {
        const { error } = await supabase.functions.invoke('calendar-sync', {
          body: {
            action: 'insert',
            event: {
              id: e.id,
              title: e.title,
              event_date: e.event_date,
              end_date: e.end_date || e.event_date,
              start_time: e.start_time,
              end_time: e.end_time,
              location: e.location,
              description: e.description,
            },
          },
        })
        if (error) {
          if (!firstErr) firstErr = error.message || 'unknown error'
        } else {
          ok += 1
        }
      }
      if (ok === upcoming.length) {
        setToast({ message: `Synced ${ok} upcoming event${ok === 1 ? '' : 's'} to the church Google Calendar.`, type: 'success' })
      } else {
        setToast({ message: `Synced ${ok} of ${upcoming.length} events.${firstErr ? ` First error: ${firstErr}` : ''}`, type: 'error' })
      }
    } catch (err) {
      setToast({ message: err.message || 'Sync failed — is the calendar-sync function deployed?', type: 'error' })
    }
    setSyncingAll(false)
  }

  const confirmDelete = async (id) => {
    setSaving(true)
    try {
      // Remove the Google event FIRST, while the database row still exists so the
      // sync function can look up its Google id. Then delete the row.
      await fireSync({ action: 'delete', event: { id } }, 'Event deleted.')
      const { error } = await supabase.from('calendar_events').delete().eq('id', id)
      if (error) throw error
      setDeleteId(null)
      await loadEvents()
    } catch (err) {
      setToast({ message: err.message || 'Delete failed.', type: 'error' })
      setDeleteId(null)
    }
    setSaving(false)
  }

  return (
    <div className="admin-calendar-root">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="admin-calendar-top">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Manage Calendar</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#999' }}>Add, edit, or remove church events. Every save syncs to the shared church Google Calendar automatically.</p>
        </div>
        <div className="admin-calendar-top__actions">
          <button
            type="button"
            className="admin-cal-btn admin-cal-btn--sync"
            onClick={syncAllToGoogle}
            disabled={syncingAll || loading}
          >
            {syncingAll ? 'Syncing…' : 'Sync'}
          </button>
          </div>
      </div>

      <div className="admin-calendar-grid">
        <div className="admin-cal-panel" ref={calendarPanelRef}>
          <div className="calendar admin-calendar">
            <div className="calendar__header">
              <button type="button" className="calendar__nav" aria-label="Previous month" onClick={prevMonth}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="calendar__label">{monthLabel}</span>
              <button type="button" className="calendar__nav" aria-label="Next month" onClick={nextMonth}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <div className="calendar__grid">
              {WEEKDAYS.map((d) => (
                <div key={d} className="calendar__weekday">
                  {d}
                </div>
              ))}
              {cells}
            </div>
          </div>
        </div>

        <div className="admin-cal-panel admin-cal-panel--upcoming" ref={upcomingPanelRef}>
          <div className="admin-cal-panel__head">
            <div className="admin-cal-tabs">
              <button
                type="button"
                className={['admin-cal-tab', mode === 'upcoming' ? 'admin-cal-tab--active' : ''].filter(Boolean).join(' ')}
                onClick={() => setMode('upcoming')}
              >
                Upcoming Events
              </button>
            <button
              type="button"
              className={['admin-cal-tab', 'admin-cal-tab--past', mode === 'past' ? 'admin-cal-tab--active' : ''].filter(Boolean).join(' ')}
              onClick={showPast}
            >
              Past Events
            </button>
            </div>

            <button type="button" className="btn-primary admin-cal-panel__add" onClick={openAdd} disabled={saving}>
              Add New Event
            </button>
          </div>

          {mode === 'upcoming' ? (
            loading ? (
              <p className="admin-cal-empty">Loading…</p>
            ) : upcoming.length === 0 ? (
              <p className="admin-cal-empty">No upcoming events yet.</p>
            ) : (
              <div className="admin-cal-list" ref={upcomingListRef}>
                {upcoming.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    saving={saving}
                    deleteId={deleteId}
                    highlighted={isInRange(e, selectedDay)}
                    onEdit={openEdit}
                    onAskDelete={setDeleteId}
                    onKeep={() => setDeleteId(null)}
                    onDelete={confirmDelete}
                  />
                ))}
              </div>
            )
          ) : (
            <>
              <div className="admin-cal-past-nav">
                <button type="button" className="calendar__nav" aria-label="Previous month" onClick={pastPrevMonth}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <select className="admin-cal-past-select" value={pastMonth} onChange={(e) => setPastMonth(Number(e.target.value))}>
                  {MONTHS.map((monthName, i) => (
                    <option key={monthName} value={i}>{monthName}</option>
                  ))}
                </select>
                <select className="admin-cal-past-select admin-cal-past-select--year" value={pastYear} onChange={(e) => setPastYear(Number(e.target.value))}>
                  {pastYearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button type="button" className="calendar__nav" aria-label="Next month" onClick={pastNextMonth}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
              {pastEvents.length === 0 ? (
                <p className="admin-cal-empty">No past events in {MONTHS[pastMonth]} {pastYear}.</p>
              ) : (
                <div className="admin-cal-list admin-cal-list--past" ref={upcomingListRef}>
                  {pastEvents.map((e) => (
                    <EventRow
                      key={e.id}
                      event={e}
                      saving={saving}
                      deleteId={deleteId}
                      highlighted={isInRange(e, selectedDay)}
                      onEdit={openEdit}
                      onAskDelete={setDeleteId}
                      onKeep={() => setDeleteId(null)}
                      onDelete={confirmDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="modal-backdrop" onClick={closeForm}>
          <form
            className="modal admin-cal-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="modal__header">
              <h3 className="modal__title">{editingId ? 'Edit Event' : 'Add New Event'}</h3>
              <button type="button" className="modal__close" aria-label="Close" onClick={closeForm}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-cal-form__body">
              <div className="admin-form-group">
                <label htmlFor="cal-title">
                  Title <span className="admin-form-hint">(required)</span>
                </label>
                <input id="cal-title" type="text" value={form.title} onChange={setField('title')} placeholder="e.g. Sunday Worship Service" />
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label htmlFor="cal-start">Start Date</label>
                  <input id="cal-start" type="date" value={form.startDate} min={editingId ? undefined : todayKey} onChange={setStartDate} />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="cal-end">End Date</label>
                  <input id="cal-end" type="date" value={form.endDate} onChange={setField('endDate')} />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="cal-stime">Start Time</label>
                  <TimeStepField id="cal-stime" value={form.startTime} onChange={setFieldTime('startTime')} />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="cal-etime">End Time</label>
                  <TimeStepField id="cal-etime" value={form.endTime} onChange={setFieldTime('endTime')} />
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="cal-loc">Location</label>
                <input id="cal-loc" type="text" value={form.location} onChange={setField('location')} placeholder="Main Sanctuary" />
              </div>

              <div className="admin-form-group">
                <label htmlFor="cal-desc">Description</label>
                <textarea id="cal-desc" value={form.description} onChange={setField('description')} placeholder="Event details…" />
              </div>
            </div>
            <div className="admin-cal-form__footer">
              <button type="button" className="admin-cal-btn admin-cal-btn--cancel" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CalendarAdmin