import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from './supabase'

const CACHE_KEY = 'ministries_content_cache_v1'
// Within this window a refresh is served straight from cache (no DB query).
const TTL_MS = 60 * 1000

let cache = null
let inflight = null
let revalidated = false
const listeners = new Set()

const toMap = (rows) => {
  const map = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

const readPersisted = () => {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.rows)) {
        cache = { rows: parsed.rows, map: toMap(parsed.rows), savedAt: parsed.savedAt || 0, ready: true }
      }
    }
  } catch {
    cache = null
  }
  return cache
}

const persist = (rows, savedAt) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt, rows }))
  } catch {
    // storage full/unavailable — keep in-memory only
  }
}

const setCache = (rows) => {
  const savedAt = Date.now()
  cache = { rows, map: toMap(rows), savedAt, ready: true }
  persist(rows, savedAt)
  listeners.forEach((fn) => fn())
}

const fetchAllRows = () => {
  if (!inflight) {
    inflight = supabase
      .from('ministries_content')
      .select('key, value')
      .then(({ data, error }) => {
        if (error) throw error
        return data || []
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Revalidate at most once per page load. If the cache is still fresh, do nothing.
const revalidate = () => {
  if (revalidated) return
  revalidated = true
  const existing = readPersisted()
  if (existing && Date.now() - existing.savedAt < TTL_MS) return
  fetchAllRows()
    .then((rows) => {
      const before = readPersisted()
      const beforeSnap = before ? JSON.stringify(before.map) : null
      if (beforeSnap !== JSON.stringify(toMap(rows))) {
        setCache(rows)
      } else if (cache) {
        // Unchanged — just bump freshness so we don't re-query soon after.
        cache.savedAt = Date.now()
      }
    })
    .catch(() => {
      // Network error — keep serving whatever cache exists.
    })
}

const emptySnapshot = Object.freeze({ map: {}, ready: false })
const getSnapshot = () => readPersisted() || emptySnapshot

// Call after an admin save so the public cache reflects the change immediately.
export function writeMinistryContentCache(rows) {
  setCache(rows)
}

export function useMinistryContent() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  useEffect(() => {
    readPersisted()
    revalidate()
  }, [])
  return snapshot
}