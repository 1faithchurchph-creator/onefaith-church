import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/image.png'

const calendarId = import.meta.env.VITE_CHURCH_CALENDAR_ID
const subscribeUrl = calendarId
  ? `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(`https://calendar.google.com/calendar/ical/${calendarId}/public/basic.ics`)}`
  : null

const privacySections = [
  {
    title: '1. What this covers',
    body: 'This policy explains how One Faith Church in Christ Philippines ("we", "us") handles information when ministry members connect their Google Calendar to our church website, so that church events can be added to their calendar automatically.',
  },
  {
    title: '2. Information we collect',
    body: 'When you (or our ministry administrator) add you as a member, we store your name, email address, and optionally your spiritual and physical birthdays and a profile picture. Church events are published to a public Google Calendar that belongs to the church. If you subscribe to that calendar, you do so directly with Google — we never see or store any of your Google account details, and we never write anything to your personal calendar.',
  },
  {
    title: '3. What we use it for',
    body: 'We use this information solely to maintain the church member list (used only by our administrators), publish church events to the church\'s public Google Calendar so anyone can subscribe, and keep event details up to date for everyone who subscribes.',
  },
  {
    title: '4. What we never do',
    body: 'We do not sell, rent, or share your information with anyone. We never read, store, or write to your personal Google Calendar. We do not send you marketing.',
  },
  {
    title: '5. Your control',
    body: 'You can stop church events from appearing on your Google Calendar at any time by unsubscribing from the church calendar in your own Google Calendar settings. Deleting your member record (by asking our ministry administrator) removes all of the stored information we hold about you.',
  },
  {
    title: '6. Data storage',
    body: 'Member information is stored securely on our hosting provider (Supabase, a Google-independent cloud service) and is accessible only to our administrators. Church events are published to a public Google Calendar owned by the church, so anyone with the link can view or subscribe to them. We keep member data only as long as you remain a member.',
  },
  {
    title: '7. Contact',
    body: 'Questions about this policy can be sent to our church through the contact section of this website, or by contacting your ministry administrator directly.',
  },
]

// phase: loading | invalid | error | form | already | success
const Permissions = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const connect = searchParams.get('connect') === '1'

  const [phase, setPhase] = useState('loading')
  const [member, setMember] = useState(null)
  const [agree, setAgree] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const verify = async () => {
      if (!token) {
        setPhase('invalid')
        return
      }
      try {
        const { data, error } = await supabase.functions.invoke('calendar-consent', {
          body: { action: 'verify', token },
        })
        if (error) throw error
        if (!active) return
        if (data?.notFound) setPhase('invalid')
        else if (data?.alreadyConsented) {
          setMember(data)
          setPhase('already')
        } else {
          setMember(data)
          setPhase('form')
        }
      } catch {
        if (active) setPhase('error')
      }
    }
    verify()
    return () => {
      active = false
    }
  }, [token])

  const handleConfirm = async () => {
    setAccepting(true)
    try {
      const { data, error } = await supabase.functions.invoke('calendar-consent', {
        body: { action: 'accept', token },
      })
      if (error) throw error
      if (data?.notFound) {
        setAccepting(false)
        setPhase('invalid')
        return
      }
      setMember(data)
      setPhase('success')
      // Same-tab forward to Google's "Add calendar" page to finish subscribing.
      if (connect && subscribeUrl) {
        window.location.replace(subscribeUrl)
      }
    } catch {
      setAccepting(false)
      setPhase('error')
    }
  }

  const firstName = (member?.name || '').trim().split(/\s+/)[0] || ''

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src={logo} alt="One Faith Church in Christ Philippines" style={styles.logo} />
        </div>

        {phase === 'loading' && (
          <>
            <h1 style={styles.h1}>Calendar Event Permission</h1>
            <p style={styles.p}>Checking your invitation&hellip;</p>
          </>
        )}

        {phase === 'invalid' && (
          <>
            <h1 style={styles.h1}>Invitation not found</h1>
            <p style={styles.p}>
              This invitation link isn&apos;t valid or has already been used. Ask your ministry administrator to
              send you a new one.
            </p>
            <Link to="/" style={styles.link}>Go to homepage</Link>
          </>
        )}

        {phase === 'error' && (
          <>
            <h1 style={styles.h1}>Something went wrong</h1>
            <p style={styles.p}>We couldn&apos;t process your request. Please try again in a moment.</p>
            <button type="button" style={styles.primaryBtn} onClick={() => window.location.reload()}>
              Try again
            </button>
          </>
        )}

        {phase === 'form' && (
          <>
            <h1 style={styles.h1}>Calendar Event Permission</h1>
            <p style={styles.meta}>One Faith Church in Christ Philippines &middot; {firstName || 'Dear member'}</p>

            <p style={styles.p}>
              We&apos;d like your permission to add our church events to your Google Calendar, so when there are
              upcoming services, fellowships, and activities you&apos;ll see them right on your calendar.
            </p>

            <div style={styles.legalBox}>
              <h2 style={styles.legalH2}>Terms &amp; Conditions</h2>
              <p style={styles.legalP}>By agreeing below, you give One Faith Church in Christ Philippines permission to add its church events to your Google Calendar. Specifically:</p>
              <ul style={styles.legalUl}>
                <li>Church events can be added to your Google Calendar automatically.</li>
                <li>You can stop at any time by unsubscribing from the church calendar in your Google Calendar settings.</li>
                <li>We never see your Google account details and never read anything else in your calendar.</li>
                <li>Your information is used only to keep you informed of church events and is never sold or shared.</li>
              </ul>
              <p style={styles.legalP}>
                You keep full control and can remove the church calendar at any time. Your consent is recorded
                when you tap Confirm below.
              </p>

              <h2 style={styles.legalH2}>Privacy Policy</h2>
              <p style={styles.legalMeta}>One Faith Church in Christ Philippines &middot; Last updated: August 7, 2026</p>
              {privacySections.map((s) => (
                <div key={s.title}>
                  <h3 style={styles.legalH3}>{s.title}</h3>
                  <p style={styles.legalP}>{s.body}</p>
                </div>
              ))}

              <label style={styles.agree}>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={styles.checkbox} />
                <span style={styles.agreeText}>
                  I have read and agree to the <strong>Terms &amp; Conditions</strong> and the <strong>Privacy Policy</strong>.
                </span>
              </label>
            </div>

            <button
              type="button"
              style={{ ...styles.primaryBtn, ...(agree ? {} : styles.primaryBtnDisabled) }}
              disabled={!agree || accepting}
              onClick={handleConfirm}
            >
              {accepting ? 'Saving…' : 'Confirm'}
            </button>
          </>
        )}

        {phase === 'already' && (
          <>
            <h1 style={styles.h1}>You&apos;ve already given permission</h1>
            <p style={styles.p}>
              Thank you{firstName ? `, ${firstName}` : ''}! Your permission is already recorded.
              {connect && subscribeUrl ? ' If you haven’t yet, you can add the church calendar to your Google Calendar below.' : ''}
            </p>
            {connect && subscribeUrl && (
              <button type="button" style={styles.primaryBtn} onClick={() => window.location.replace(subscribeUrl)}>
                Add church calendar
              </button>
            )}
            <button type="button" style={styles.primaryBtn} onClick={() => navigate('/')}>
              Done
            </button>
          </>
        )}

        {phase === 'success' && (
          <>
            <h1 style={styles.h1}>Thank you{firstName ? `, ${firstName}` : ''}!</h1>
            <p style={styles.p}>
              Your permission has been recorded.{connect && subscribeUrl
                ? ' You’re now being taken to Google Calendar to finish adding the church calendar — after one tap it stays connected automatically.'
                : ' Church events stay visible on our calendar page.'}
            </p>
            {!subscribeUrl && (
              <button type="button" style={styles.primaryBtn} onClick={() => navigate('/')}>
                Done
              </button>
            )}
          </>
        )}
      </div>
    </main>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '3rem 1.5rem',
    boxSizing: 'border-box',
    background:
      'radial-gradient(900px 400px at 15% -5%, rgba(37, 150, 190, 0.15), transparent 60%),' +
      'radial-gradient(800px 400px at 110% 110%, rgba(232, 139, 29, 0.1), transparent 60%),' +
      'linear-gradient(180deg, #eef7fc 0%, #fbfdfe 100%)',
  },
  card: {
    width: '100%',
    maxWidth: 760,
    background: '#fff',
    border: '1px solid #e3ecf2',
    borderTop: '5px solid #2596be',
    borderRadius: 16,
    boxShadow: '0 18px 45px rgba(37, 150, 190, 0.16)',
    padding: '2.25rem 2.5rem',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '1.25rem',
  },
  logo: {
    width: 140,
    height: 140,
    objectFit: 'contain',
    borderRadius: 12,
  },
  h1: {
    margin: 0,
    fontFamily: "'Poppins', 'Lexend', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.5rem',
    color: '#0d2c3a',
    textAlign: 'center',
  },
  meta: {
    margin: '0.35rem 0 1.25rem',
    fontSize: '0.85rem',
    color: '#7a9bad',
    textAlign: 'center',
  },
  p: {
    margin: '0.9rem 0 0.6rem',
    lineHeight: 1.6,
    color: '#33414c',
  },
  legalBox: {
    marginTop: '0.9rem',
    maxHeight: 360,
    overflowY: 'auto',
    border: '1px solid #e6edf2',
    borderRadius: 12,
    padding: '1rem 1.2rem',
    background: '#fafdff',
  },
  legalH2: {
    margin: '0.8rem 0 0.4rem',
    fontSize: '1.02rem',
    color: '#0d2c3a',
  },
  legalH3: {
    margin: '0.7rem 0 0.2rem',
    fontSize: '0.9rem',
    color: '#0d2c3a',
  },
  legalMeta: {
    margin: '0 0 0.4rem',
    fontSize: '0.72rem',
    color: '#9db3bf',
  },
  legalP: {
    margin: '0 0 0.5rem',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: '#33414c',
  },
  legalUl: {
    margin: '0 0 0.5rem',
    paddingLeft: '1.2rem',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: '#33414c',
  },
  agree: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.55rem',
    marginTop: '0.9rem',
    padding: '0.9rem 0.2rem 0.2rem',
    borderTop: '1px solid #e6edf2',
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 1,
    flexShrink: 0,
    accentColor: '#2596be',
  },
  agreeText: {
    fontSize: '0.88rem',
    lineHeight: 1.5,
    color: '#33414c',
  },
  inlineLink: {
    color: '#2596be',
  },
  link: {
    display: 'inline-block',
    marginTop: '0.75rem',
    color: '#2596be',
  },
  primaryBtn: {
    display: 'block',
    width: '100%',
    marginTop: '1.4rem',
    padding: '0.9rem 1rem',
    background: '#2596be',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textAlign: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}

export default Permissions