import { Link } from 'react-router-dom'
import logo from '../assets/image.png'

const Privacy = () => {
  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src={logo} alt="One Faith Church in Christ Philippines" style={styles.logo} />
        </div>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.meta}>One Faith Church in Christ Philippines &middot; Last updated: August 7, 2026</p>

        <h2 style={styles.h2}>1. What this covers</h2>
        <p style={styles.p}>
          This policy explains how One Faith Church in Christ Philippines ("we", "us") handles information when
          ministry members connect their Google Calendar to our church website, so that church events can be added
          to their calendar automatically.
        </p>

        <h2 style={styles.h2}>2. Information we collect</h2>
        <p style={styles.p}>When you (or our ministry administrator) add you as a member, we store your name, email address, and optionally your spiritual and physical birthdays and a profile picture.</p>
        <p style={styles.p}>Church events are published to a public Google Calendar that belongs to the church. If you subscribe to that calendar, you do so directly with Google — we never see or store any of your Google account details, and we never write anything to your personal calendar.</p>

        <h2 style={styles.h2}>3. What we use it for</h2>
        <p style={styles.p}>We use this information solely to:</p>
        <ul style={styles.ul}>
          <li>maintain the church member list (used only by our administrators),</li>
          <li>publish church events to the church's public Google Calendar so anyone can subscribe, and</li>
          <li>keep event details up to date for everyone who subscribes.</li>
        </ul>

        <h2 style={styles.h2}>4. What we never do</h2>
        <p style={styles.p}>We do not sell, rent, or share your information with anyone. We never read, store, or write to your personal Google Calendar. We do not send you marketing.</p>

        <h2 style={styles.h2}>5. Your control</h2>
        <p style={styles.p}>You can stop church events from appearing on your Google Calendar at any time by unsubscribing from the church calendar in your own Google Calendar settings. Deleting your member record (by asking our ministry administrator) removes all of the stored information we hold about you.</p>

        <h2 style={styles.h2}>6. Data storage</h2>
        <p style={styles.p}>Member information is stored securely on our hosting provider (Supabase, a Google-independent cloud service) and is accessible only to our administrators. Church events are published to a public Google Calendar owned by the church, so anyone with the link can view or subscribe to them. We keep member data only as long as you remain a member.</p>

        <h2 style={styles.h2}>7. Contact</h2>
        <p style={styles.p}>
          Questions about this policy can be sent to our church through the contact section of this website, or by
          contacting your ministry administrator directly.
        </p>

        <Link to="/" style={styles.backLink}>Back to homepage</Link>
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
    fontSize: '1.7rem',
    color: '#0d2c3a',
    textAlign: 'center',
  },
  meta: {
    margin: '0.35rem 0 1.5rem',
    fontSize: '0.85rem',
    color: '#7a9bad',
    textAlign: 'center',
  },
  h2: {
    margin: '1.4rem 0 0.4rem',
    fontSize: '1.05rem',
    color: '#0d2c3a',
  },
  p: {
    margin: '0 0 0.6rem',
    lineHeight: 1.6,
    color: '#33414c',
  },
  ul: {
    margin: '0 0 0.6rem',
    paddingLeft: '1.3rem',
    lineHeight: 1.7,
    color: '#33414c',
  },
  backLink: {
    display: 'inline-block',
    marginTop: '1.5rem',
    color: '#2596be',
    fontWeight: 600,
  },
}

export default Privacy
