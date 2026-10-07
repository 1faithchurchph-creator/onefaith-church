// @ts-nocheck
// send-invite — records an invite token on a member and emails a single-button
// invitation whose button opens the consent page on the website. The member
// reviews the Terms & Conditions and Privacy Policy, ticks one box, and confirms —
// consent is recorded, then they're handed to Google's "Add calendar" page to
// finish subscribing to the church's public calendar.
//
// Self-contained single file — paste it into a Supabase Edge Function named
// `send-invite` (Verify JWT ON). No CLI needed.
//
// Reads secrets:
//   GMAIL_USER             — the church Gmail address that sends the email
//                            (1faithchurchph@gmail.com)
//   GMAIL_APP_PASSWORD     — an App Password created on that Gmail account
//   SITE_URL               — the website origin (https://onefaithph.vercel.app)
//
// POST { memberId, name, email }
// Generates a unique invite token, saves it plus invite_sent_at on the member
// row, then emails a button linking to the consent page with the token as a
// query param, so the page can tie the approval back to this member.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
}

// 32-char hex token — random, unguessable, treated as the member's credential.
function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function buildHtml(name, consentUrl, siteUrl) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f8fb;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e3ecf2;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <h1 style="margin:0 0 4px;color:#0d2c3a;font-size:22px;">One Faith Church in Christ Philippines</h1>
                <p style="margin:0;color:#7a9bad;font-size:13px;">Church events on your Google Calendar</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;color:#33414c;font-size:15px;line-height:1.6;">
                <p>Hello ${escapeHtml(name)},</p>
                <p>We'd like to add our church events to your Google Calendar, so you never miss a service, fellowship,
                or activity when one is coming up.</p>

                <p style="text-align:center;margin:28px 0 8px;">
                  <a href="${consentUrl}" style="display:inline-block;background:#2596be;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:15px;font-weight:600;">Review &amp; accept</a>
                </p>
                <p style="font-size:13px;color:#7a9bad;margin:0 0 24px;">
                  This takes you to a short page where you can read our Terms &amp; Conditions and Privacy Policy, tick one
                  box, and finish connecting the church calendar — no other steps.
                </p>

                <hr style="border:none;border-top:1px solid #eef0f3;margin:28px 0;" />
                <p style="margin:0 0 8px;font-size:15px;"><strong>What this means</strong></p>
                <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#33414c;line-height:1.6;">
                  <li>Church events can be added to your Google Calendar automatically.</li>
                  <li>You can stop at any time by unsubscribing from the church calendar in your Google Calendar settings.</li>
                  <li>We never see your Google account details and never read anything else in your calendar.</li>
                </ul>

                <p style="margin:0;font-size:13px;color:#7a9bad;line-height:1.6;">
                  Your information is used only to keep you informed of church events and is never sold or shared.
                  Read the full <a href="${siteUrl}/privacy" style="color:#2596be;">Privacy Policy</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0;font-size:12px;color:#9db3bf;line-height:1.5;">
                  If the button doesn't work, copy this link into your browser:<br />
                  <a href="${consentUrl}" style="color:#2596be;word-break:break-all;">${consentUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  }

  const gmailUser = Deno.env.get('GMAIL_USER')
  const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD')
  const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/+$/, '')
  if (!gmailUser || !gmailPass || !siteUrl) {
    return Response.json(
      { error: 'GMAIL_USER, GMAIL_APP_PASSWORD and SITE_URL secrets are not set' },
      { status: 500, headers: corsHeaders },
    )
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
  }

  const memberId = payload?.memberId
  const name = payload?.name
  const email = payload?.email
  if (!memberId || !name || !email) {
    return Response.json({ error: 'memberId, name and email are required' }, { status: 400, headers: corsHeaders })
  }

  const token = makeToken()
  const consentUrl = `${siteUrl}/permissions?token=${token}&connect=1`

  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

  try {
    const { error: upErr } = await supabase
      .from('ministry_members')
      .update({ invite_token: token, invite_sent_at: new Date().toISOString() })
      .eq('id', memberId)
    if (upErr) throw upErr

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.sendMail({
      from: `One Faith Church in Christ Philippines <${gmailUser}>`,
      to: email,
      subject: 'Grant permission to add church events to your calendar',
      html: buildHtml(name, consentUrl, siteUrl),
    })
  } catch (err) {
    console.error('send-invite failed', { memberId }, err)
    return Response.json({ error: err?.message || 'Invite failed' }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ ok: true }, { headers: corsHeaders })
})