// @ts-nocheck
// calendar-sync — shared-church-calendar sync via a Google Service Account.
//
// Self-contained single file — paste it into a Supabase Edge Function named
// `calendar-sync` (Verify JWT ON). No CLI needed.
//
// Reads secrets:
//   GOOGLE_SERVICE_ACCOUNT — the service-account JSON key contents
//   CHURCH_CALENDAR_ID     — the church calendar id (e.g. name@gmail.com)
//
// Google assigns its own event ids, so we store the assigned id on the
// calendar_events row in a `google_id` column. That column must be added once:
//
//   ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_id text;
//
// POST { action: 'insert' | 'update' | 'delete', event: {...calendar_events row...} }
// Writes the change to the church's ONE public Google Calendar; Google syncs it
// out to every subscribed member automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const apiBase = 'https://www.googleapis.com/calendar/v3'
const tokenUri = 'https://oauth2.googleapis.com/token'
const calendarScope = 'https://www.googleapis.com/auth/calendar'

// The browser sends an OPTIONS preflight before the real POST (cross-origin +
// Authorization header). The platform adds CORS headers on auth failures but not
// on responses this function returns itself, so we must handle OPTIONS + echo
// the headers back on every response or the browser blocks the request.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
}

function addDays(dk, n) {
  const [y, m, d] = dk.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// "09:00" (or "9:5") -> "09:00:00"
function toTime(t) {
  const p = t.split(':').map((x) => x.padStart(2, '0'))
  while (p.length < 3) p.push('00')
  return p.join(':')
}

function b64url(u) {
  let bin = ''
  for (const b of u) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importPrivateKey(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

// Mint a short-lived access token for the service account (JWT bearer grant).
async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: key.client_email,
    scope: calendarScope,
    aud: key.token_uri || tokenUri,
    iat: now,
    exp: now + 3600,
  }
  const input = `${b64url(new TextEncoder().encode(JSON.stringify(header)))}.${b64url(
    new TextEncoder().encode(JSON.stringify(payload)),
  )}`
  const sig = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    await importPrivateKey(key.private_key),
    new TextEncoder().encode(input),
  )
  const assertion = `${input}.${b64url(new Uint8Array(sig))}`
  const res = await fetch(key.token_uri || tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) throw new Error(`Token exchange failed: ${res.status}`)
  return data.access_token
}

function googleEventBody(e) {
  const b = { summary: e.title }
  if (e.location) b.location = e.location
  if (e.description) b.description = e.description
  if (e.start_time) {
    // The wall-clock time you enter, interpreted in the church's home timezone.
    // Google requires dateTime to carry a timeZone (or an offset), and Manila is
    // the correct zone for every church member, so they all see the same time.
    // Do NOT convert the clock — pass 10:00 as 10:00 Manila, not 10:00 UTC.
    b.start = { dateTime: `${e.event_date}T${toTime(e.start_time)}`, timeZone: 'Asia/Manila' }
    if (e.end_time) b.end = { dateTime: `${e.end_date || e.event_date}T${toTime(e.end_time)}`, timeZone: 'Asia/Manila' }
  } else {
    // All-day: Google's end date is exclusive.
    b.start = { date: e.event_date }
    b.end = { date: addDays(e.end_date || e.event_date, 1) }
  }
  return b
}

async function createEvent(token, calendarId, body) {
  const r = await fetch(`${apiBase}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const t = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Google insert failed: ${r.status} ${t?.error?.message || ''}`)
  return t
}

async function updateEvent(token, calendarId, googId, body) {
  const r = await fetch(`${apiBase}/calendars/${encodeURIComponent(calendarId)}/events/${googId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.json().catch(() => ({}))
    throw new Error(`Google update failed: ${r.status} ${t?.error?.message || ''}`)
  }
}

async function removeEvent(token, calendarId, googId) {
  const r = await fetch(`${apiBase}/calendars/${encodeURIComponent(calendarId)}/events/${googId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok && r.status !== 404) throw new Error(`Google delete failed: ${r.status}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // Plain 200 (not 204) so no runtime ever second-guesses a no-body response.
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  }

  const secretRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
  const calendarId = Deno.env.get('CHURCH_CALENDAR_ID')
  if (!secretRaw || !calendarId) {
    return Response.json({ error: 'GOOGLE_SERVICE_ACCOUNT and CHURCH_CALENDAR_ID secrets are not set' }, { status: 500, headers: corsHeaders })
  }

  let key
  try {
    key = JSON.parse(secretRaw)
  } catch {
    return Response.json({ error: 'GOOGLE_SERVICE_ACCOUNT is not valid JSON' }, { status: 500, headers: corsHeaders })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
  }

  const action = payload?.action
  const event = payload?.event
  if (!event || !event.id) return Response.json({ error: 'Missing event' }, { status: 400, headers: corsHeaders })

  // Map our event id to its Google id via the calendar_events.google_id column.
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

  try {
    const token = await getAccessToken(key)
    if (action === 'delete') {
      const { data } = await supabase.from('calendar_events').select('google_id').eq('id', event.id).maybeSingle()
      if (data?.google_id) {
        await removeEvent(token, calendarId, data.google_id)
        await supabase.from('calendar_events').update({ google_id: null }).eq('id', event.id)
      }
    } else {
      const { data } = await supabase.from('calendar_events').select('google_id').eq('id', event.id).maybeSingle()
      const body = googleEventBody(event)
      if (data?.google_id) {
        await updateEvent(token, calendarId, data.google_id, body)
      } else {
        const created = await createEvent(token, calendarId, body)
        await supabase.from('calendar_events').update({ google_id: created.id }).eq('id', event.id)
      }
    }
  } catch (err) {
    console.error('calendar sync failed', { action, eventId: event.id }, err)
    return Response.json({ error: err?.message || 'Sync failed' }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ synced: 1 }, { headers: corsHeaders })
})