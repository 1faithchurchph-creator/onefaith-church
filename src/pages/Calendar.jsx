import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WEEKDAYS, MONTHS, dateKey, parseDateKey, formatTime, expandDates, dateRangeLabel } from '../lib/calendar'
import '../css/calendar.css'

const EventCard = ({ event }) => {
  const [, m, d] = event.event_date.split('-').map(Number)
  const isMulti = !!event.end_date && event.end_date > event.event_date
  const timeLabel = event.start_time
    ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ''}`
    : 'All day'

  return (
    <article className="calendar-event">
      <div className="calendar-event__date">
        <span className="calendar-event__day">{d}</span>
        <span className="calendar-event__month">{MONTHS[m - 1].slice(0, 3)}</span>
      </div>
      <div className="calendar-event__body">
        <h3 className="calendar-event__title">{event.title}</h3>
        <p className="calendar-event__meta">
          {isMulti && <span className="calendar-event__range">{dateRangeLabel(event.event_date, event.end_date)}</span>}
          <span className="calendar-event__time">{timeLabel}</span>
          {event.location && <span className="calendar-event__location">{event.location}</span>}
        </p>
      </div>
    </article>
  )
}

const Calendar = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(todayKey)
  const [modalKey, setModalKey] = useState(null)

  const calendarRef = useRef(null)
  const sideRef = useRef(null)

  // Keep the events panel the same height as the calendar; scroll inside it.
  useEffect(() => {
    const side = sideRef.current
    const calendar = calendarRef.current
    if (!side || !calendar) return
    const ro = new ResizeObserver(() => {
      side.style.maxHeight = `${calendar.offsetHeight}px`
    })
    ro.observe(calendar)
    return () => ro.disconnect()
  }, [])

  // Close the day modal on Escape and lock page scroll while it's open.
  useEffect(() => {
    if (!modalKey) return
    const onKey = (e) => {
      if (e.key === 'Escape') setModalKey(null)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modalKey])

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

  const byDate = useMemo(() => {
    const map = {}
    for (const e of events) {
      for (const k of expandDates(e.event_date, e.end_date)) {
        if (k < todayKey) continue
        if (!map[k]) map[k] = []
        map[k].push(e)
      }
    }
    return map
  }, [events, todayKey])

  const upcoming = events
    .filter((e) => (e.end_date || e.event_date) >= todayKey)
    .sort((a, b) => {
      if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1
      return (a.start_time || '').localeCompare(b.start_time || '')
    })

  const modalDate = modalKey ? parseDateKey(modalKey) : null
  const modalDateLabel = modalDate
    ? modalDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const modalEvents = modalKey ? byDate[modalKey] || [] : []

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

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(<div key={`blank-${i}`} className="calendar__day calendar__day--blank" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(viewYear, viewMonth, day)
    const isToday = key === todayKey
    const isSelected = key === selected
    const isPast = key < todayKey
    const hasEvents = (byDate[key] || []).length > 0
    cells.push(
      <button
        key={key}
        type="button"
        className={[
          'calendar__day',
          isPast ? 'calendar__day--past' : '',
          isToday ? 'calendar__day--today' : '',
          isSelected ? 'calendar__day--selected' : '',
          hasEvents ? 'calendar__day--events' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          setSelected(key)
          setModalKey(key)
        }}
        aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
      >
        <span className="calendar__day-num">{day}</span>
      </button>
    )
  }

  return (
    <main className="calendar-page">
      <div className="calendar-layout">
        <aside className="calendar-side" ref={sideRef}>
          <h2 className="calendar-side__title">Upcoming Events</h2>
          {loading ? (
            <p className="calendar-empty">Loading events…</p>
          ) : upcoming.length === 0 ? (
            <p className="calendar-empty">No upcoming events yet.</p>
          ) : (
            <ul className="calendar-list">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="calendar-main">
          <div className="calendar" ref={calendarRef}>
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
        </section>
      </div>

      {modalKey && (
        <div className="modal-backdrop" onClick={() => setModalKey(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modalDateLabel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h3 className="modal__title">{modalDateLabel}</h3>
              <button
                type="button"
                className="modal__close"
                aria-label="Close"
                onClick={() => setModalKey(null)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="modal__body">
              {modalEvents.length === 0 ? (
                <p className="modal__empty">No events on this day.</p>
              ) : (
                <ul className="modal__list">
                  {modalEvents.map((e) => (
                    <li key={e.id}>
                      <EventCard event={e} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Calendar
