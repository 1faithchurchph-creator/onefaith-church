// @ts-nocheck
// calendar-consent — verifies an invite token and records a member's consent to
// receive church events on their Google Calendar.
//
// Self-contained single file — paste it into a Supabase Edge Function named
// `calendar-consent` (Verify JWT ON). No CLI needed.
//
// Runs with the service-role key so the members table stays protected by RLS —
// the public /permissions page only ever talks to this function, never the table.
//
// POST { action: 'verify' | 'accept', token }
//   verify -> { notFound: true } | { name, email, alreadyConsented }
//   accept -> { notFound: true } | { name, email }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
  }

  const action = payload?.action
  const token = payload?.token
  if (!action || !token) {
    return Response.json({ error: 'action and token are required' }, { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

  try {
    if (action === 'verify') {
      const { data, error } = await supabase
        .from('ministry_members')
        .select('name, email, consent_granted_at')
        .eq('invite_token', token)
        .maybeSingle()
      if (error) throw error
      if (!data) return Response.json({ notFound: true }, { headers: corsHeaders })
      return Response.json(
        { name: data.name, email: data.email, alreadyConsented: !!data.consent_granted_at },
        { headers: corsHeaders },
      )
    }

    if (action === 'accept') {
      const { data, error } = await supabase
        .from('ministry_members')
        .update({ consent_granted_at: new Date().toISOString() })
        .eq('invite_token', token)
        .select('name, email')
        .maybeSingle()
      if (error) throw error
      if (!data) return Response.json({ notFound: true }, { headers: corsHeaders })
      return Response.json({ name: data.name, email: data.email }, { headers: corsHeaders })
    }
  } catch (err) {
    console.error('calendar-consent failed', { action }, err)
    return Response.json({ error: err?.message || 'Consent failed' }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400, headers: corsHeaders })
})
