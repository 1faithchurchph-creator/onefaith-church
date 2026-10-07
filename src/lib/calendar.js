export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const dateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = t.slice(0, 5).split(':')
  const hour = Number(h)
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

// Inclusive list of date keys from start to end (end omitted = single day).
export const expandDates = (startKey, endKey) => {
  if (endKey && endKey < startKey) return []
  const [y, m, d] = startKey.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const out = [dateKey(start.getFullYear(), start.getMonth(), start.getDate())]
  if (!endKey) return out
  const end = parseDateKey(endKey)
  const cur = new Date(start)
  while (cur.getTime() < end.getTime()) {
    cur.setDate(cur.getDate() + 1)
    out.push(dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate()))
  }
  return out
}

// Short display label, e.g. "Aug 5" or "Aug 5 – 8" or "Aug 5 – Sep 2".
export const dateRangeLabel = (startKey, endKey) => {
  const s = parseDateKey(startKey)
  const start = `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()}`
  if (!endKey || endKey <= startKey) return start
  const e = parseDateKey(endKey)
  const end = `${MONTHS[e.getMonth()].slice(0, 3)} ${e.getDate()}`
  return s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
    ? `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${e.getDate()}`
    : `${start} – ${end}`
}