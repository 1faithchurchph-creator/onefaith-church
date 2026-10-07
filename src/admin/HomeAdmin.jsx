import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toEmbedUrl } from '../lib/youtube'
import Toast from '../components/Toast'
import NavbarPreview from '../components/NavbarPreview'
import { writeContentCache } from '../lib/homeContent'
import '../css/admin-forms.css'

const KEYS = [
  'review_title',
  'review_2025_youtube',
  'worship_title',
  'worship_image_left',
  'worship_image_right',
  'worship_map_coords',
  'worship_zoom_link',
  'worship_map_button',
  'worship_zoom_button',
  'testimonials_title',
  'replay_youtube',
  'international_title',
  'international_body',
  'international_button',
  'replay_title',
  'replay_body',
  'replay_button',
  'empower_title',
  'empower_body',
  'empower_button',
  'give_youtube',
  'navbar_cover',
  'navbar_cover_position',
  'tagline_heading',
  'tagline_body',
  'tagline_image',
  'ministries_title',
  'ministries_button',
  'events_title',
  'events_button',
  'give_button',
]

const HomeAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewLink, setReviewLink] = useState('')

  const [worshipTitle, setWorshipTitle] = useState('')
  const [leftImageUrl, setLeftImageUrl] = useState('')
  const [leftFile, setLeftFile] = useState(null)
  const [rightImageUrl, setRightImageUrl] = useState('')
  const [rightFile, setRightFile] = useState(null)
  const [mapCoords, setMapCoords] = useState('')
  const [zoomLink, setZoomLink] = useState('')
  const [mapButton, setMapButton] = useState('')
  const [zoomButton, setZoomButton] = useState('')

  const [testimonialsTitle, setTestimonialsTitle] = useState('')
  const [replayLink, setReplayLink] = useState('')

  const [internationalTitle, setInternationalTitle] = useState('')
  const [internationalBody, setInternationalBody] = useState('')
  const [internationalButton, setInternationalButton] = useState('')
  const [replayTitle, setReplayTitle] = useState('')
  const [replayBody, setReplayBody] = useState('')
  const [replayButton, setReplayButton] = useState('')

  const [empowerTitle, setEmpowerTitle] = useState('')
  const [empowerBody, setEmpowerBody] = useState('')
  const [empowerButton, setEmpowerButton] = useState('')
  const [giveLink, setGiveLink] = useState('')

  const [navbarCoverUrl, setNavbarCoverUrl] = useState('')
  const [navbarCoverFile, setNavbarCoverFile] = useState(null)
  const [navbarCoverPosition, setNavbarCoverPosition] = useState('50% 50%')
  const [taglineHeading, setTaglineHeading] = useState('')
  const [taglineBody, setTaglineBody] = useState('')
  const [taglineImageUrl, setTaglineImageUrl] = useState('')
  const [taglineImageFile, setTaglineImageFile] = useState(null)
  const [ministriesTitle, setMinistriesTitle] = useState('')
  const [ministriesButton, setMinistriesButton] = useState('')
  const [eventsTitle, setEventsTitle] = useState('')
  const [eventsButton, setEventsButton] = useState('')
  const [giveButton, setGiveButton] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('home_content')
        .select('key, value')
        .in('key', KEYS)

      if (!error && data) {
        const get = (k) => data.find((r) => r.key === k)?.value || ''
        setReviewTitle(get('review_title'))
        setReviewLink(get('review_2025_youtube'))
        setWorshipTitle(get('worship_title'))
        setLeftImageUrl(get('worship_image_left'))
        setRightImageUrl(get('worship_image_right'))
        setMapCoords(get('worship_map_coords'))
        setZoomLink(get('worship_zoom_link'))
        setMapButton(get('worship_map_button'))
        setZoomButton(get('worship_zoom_button'))
        setTestimonialsTitle(get('testimonials_title'))
        setReplayLink(get('replay_youtube'))
        setInternationalTitle(get('international_title'))
        setInternationalBody(get('international_body'))
        setInternationalButton(get('international_button'))
        setReplayTitle(get('replay_title'))
        setReplayBody(get('replay_body'))
        setReplayButton(get('replay_button'))
        setEmpowerTitle(get('empower_title'))
        setEmpowerBody(get('empower_body'))
        setEmpowerButton(get('empower_button'))
        setGiveLink(get('give_youtube'))
        setNavbarCoverUrl(get('navbar_cover'))
        setNavbarCoverPosition(get('navbar_cover_position') || '50% 50%')
        setTaglineHeading(get('tagline_heading'))
        setTaglineBody(get('tagline_body'))
        setTaglineImageUrl(get('tagline_image'))
        setMinistriesTitle(get('ministries_title'))
        setMinistriesButton(get('ministries_button'))
        setEventsTitle(get('events_title'))
        setEventsButton(get('events_button'))
        setGiveButton(get('give_button'))
      }
      setLoading(false)
    }

    fetchContent()
  }, [])

  const uploadImage = async (file, slot) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '')
    const filePath = `home/${slot}-${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('images').upload(filePath, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath)
    return publicUrl
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setToast(null)
    setSaving(true)

    try {
      if (reviewLink.trim()) {
        const embed = toEmbedUrl(reviewLink)
        if (!embed) {
          setToast({ message: 'Invalid YouTube link. Use a youtube.com or youtu.be URL.', type: 'error' })
          setSaving(false)
          return
        }
      }
      if (replayLink.trim()) {
        const embed = toEmbedUrl(replayLink)
        if (!embed) {
          setToast({ message: 'Invalid replay YouTube link. Use a youtube.com or youtu.be URL.', type: 'error' })
          setSaving(false)
          return
        }
      }
      if (giveLink.trim()) {
        const embed = toEmbedUrl(giveLink)
        if (!embed) {
          setToast({ message: 'Invalid give video YouTube link. Use a youtube.com or youtu.be URL.', type: 'error' })
          setSaving(false)
          return
        }
      }

      let leftUrl = leftImageUrl
      let rightUrl = rightImageUrl
      if (leftFile) leftUrl = await uploadImage(leftFile, 'worship-left')
      if (rightFile) rightUrl = await uploadImage(rightFile, 'worship-right')

      let navbarCover = navbarCoverUrl
      if (navbarCoverFile) navbarCover = await uploadImage(navbarCoverFile, 'navbar-cover')

      let taglineImage = taglineImageUrl
      if (taglineImageFile) taglineImage = await uploadImage(taglineImageFile, 'tagline')

      const now = new Date().toISOString()
      const rows = [
        { key: 'review_title', value: reviewTitle.trim() || '2025 Review', updated_at: now },
        { key: 'review_2025_youtube', value: reviewLink.trim(), updated_at: now },
        { key: 'worship_title', value: worshipTitle.trim() || 'Sunday Worship Service', updated_at: now },
        { key: 'worship_image_left', value: leftUrl, updated_at: now },
        { key: 'worship_image_right', value: rightUrl, updated_at: now },
        { key: 'worship_map_coords', value: mapCoords.trim(), updated_at: now },
        { key: 'worship_zoom_link', value: zoomLink.trim(), updated_at: now },
        { key: 'worship_map_button', value: mapButton.trim() || 'View Map & Directions', updated_at: now },
        { key: 'worship_zoom_button', value: zoomButton.trim() || 'Join the Live Service', updated_at: now },
        { key: 'testimonials_title', value: testimonialsTitle.trim() || 'Testimonials', updated_at: now },
        { key: 'replay_youtube', value: replayLink.trim(), updated_at: now },
        { key: 'international_title', value: internationalTitle.trim() || 'International Worship Service', updated_at: now },
        { key: 'international_body', value: internationalBody.trim() || 'Los Angeles USA • Manila Philippines\nPhnom Penh Cambodia • Sydney Australia\nRe-experience our fourth international service\nChrist: Mission, Message, Mutuality, Ministry. God is moving!', updated_at: now },
        { key: 'international_button', value: internationalButton.trim() || 'See Our Fourth International Worship Service', updated_at: now },
        { key: 'replay_title', value: replayTitle.trim() || 'Replay Worship Services', updated_at: now },
        { key: 'replay_body', value: replayBody.trim() || 'Watch archived communion lesson replays and get re-inspired by past series.', updated_at: now },
        { key: 'replay_button', value: replayButton.trim() || 'Go to Prior Sunday Sermons and Lessons', updated_at: now },
        { key: 'empower_title', value: empowerTitle.trim() || 'Empower & Connect', updated_at: now },
        { key: 'empower_body', value: empowerBody.trim() || 'Sometimes, life can make anyone feel powerless and disconnected. One Faith and Christ’s love empower and connect us through the work of the spirit. We need spiritual strength to meet the challenges that each state of life brings, so we host regular Faith Team meetings by life stage. Feel free to check one out!', updated_at: now },
        { key: 'empower_button', value: empowerButton.trim() || 'Contact Us to Find a Small Group', updated_at: now },
        { key: 'give_youtube', value: giveLink.trim(), updated_at: now },
        { key: 'navbar_cover', value: navbarCover, updated_at: now },
        { key: 'navbar_cover_position', value: navbarCoverPosition.trim() || '50% 50%', updated_at: now },
        { key: 'tagline_heading', value: taglineHeading.trim() || 'Welcome to One Faith Church in Christ Philippines', updated_at: now },
        { key: 'tagline_body', value: taglineBody.trim() || 'Come experience the faith and love of Jesus and the resurrection power of the Holy Spirit.', updated_at: now },
        { key: 'tagline_image', value: taglineImage, updated_at: now },
        { key: 'ministries_title', value: ministriesTitle.trim() || 'Ministries', updated_at: now },
        { key: 'ministries_button', value: ministriesButton.trim() || 'View Ministries', updated_at: now },
        { key: 'events_title', value: eventsTitle.trim() || 'Upcoming Events', updated_at: now },
        { key: 'events_button', value: eventsButton.trim() || 'View Upcoming Events', updated_at: now },
        { key: 'give_button', value: giveButton.trim() || 'Click here to find ways to give', updated_at: now },
      ]

      const { error } = await supabase.from('home_content').upsert(rows, { onConflict: 'key' })
      if (error) throw error

      writeContentCache(rows)

      setLeftImageUrl(leftUrl)
      setRightImageUrl(rightUrl)
      setLeftFile(null)
      setRightFile(null)
      setNavbarCoverUrl(navbarCover)
      setNavbarCoverFile(null)
      setTaglineImageUrl(taglineImage)
      setTaglineImageFile(null)
      setToast({ message: 'Home content updated successfully.', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Failed to save.', type: 'error' })
    }
    setSaving(false)
  }

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1>Welcome, {user.display_name || 'Admin'}</h1>
      <p style={{ color: '#999', marginBottom: '1.5rem' }}>Manage your home page from here.</p>

      <form onSubmit={handleSave} className="admin-form">
        {/* Section 1: Navbar & Hero */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Navbar &amp; Hero</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Upload the navigation image behind the menu on the Home page, and edit the welcome tagline.</p>

        <div className="admin-form-group nav-image-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>Navigation Image</span>
            <span style={{ color: '#2596be', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em' }}>1090×900</span>
          </div>

          <ImagePicker
            label="Navigation Image"
            buttonLabel="Banner behind the menu on the Home page"
            imageUrl={navbarCoverUrl}
            file={navbarCoverFile}
            setFile={setNavbarCoverFile}
            previewAspectRatio="5 / 2"
            previewHelp="Upload image then adjust crop"
          />

          <CoverCropEditor
            file={navbarCoverFile}
            imageUrl={navbarCoverUrl}
            position={navbarCoverPosition}
            onChange={setNavbarCoverPosition}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label htmlFor="tagline-heading">Tagline Heading</label>
            <input
              id="tagline-heading"
              type="text"
              value={taglineHeading}
              onChange={(e) => setTaglineHeading(e.target.value)}
              placeholder="Welcome to One Faith Church in Christ Philippines"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="tagline-body">Tagline Text</label>
            <textarea
              id="tagline-body"
              value={taglineBody}
              onChange={(e) => setTaglineBody(e.target.value)}
              placeholder="Come experience the faith and love of Jesus and the resurrection power of the Holy Spirit."
              disabled={loading}
            />
          </div>
        </div>

        <div className="admin-form-group nav-image-wrap">
          <ImagePicker
            label="Tagline Image"
            buttonLabel="Logo beside the welcome text on the Home page"
            imageUrl={taglineImageUrl}
            file={taglineImageFile}
            setFile={setTaglineImageFile}
          />
        </div>

        <hr className="admin-form-divider" />

        {/* Section 2: 2025 Review */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>2025 Review</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Edit the section title and the YouTube video shown on the public Home page.</p>

        <div className="home-admin-row">
          <div className="home-admin-preview">
            {reviewLink && toEmbedUrl(reviewLink) ? (
              <iframe
                src={toEmbedUrl(reviewLink)}
                title={reviewTitle || 'Review preview'}
                style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 8 }}
                allowFullScreen
              />
            ) : (
              <div className="home-admin-placeholder">Video preview appears here</div>
            )}
          </div>

          <div className="home-admin-fields">
            <div className="admin-form-group">
              <label htmlFor="review-title">Section Title</label>
              <input
                id="review-title"
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="2025 Review"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="review-link">YouTube Link</label>
              <input
                id="review-link"
                type="text"
                value={reviewLink}
                onChange={(e) => setReviewLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <hr className="admin-form-divider" />

        {/* Section 3: Sunday Worship Service */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Sunday Worship Service</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Upload two pictures and set the map and Zoom buttons shown on the Home page.</p>

        <div className="admin-form-group">
          <label htmlFor="worship-title">Section Title</label>
          <input
            id="worship-title"
            type="text"
            value={worshipTitle}
            onChange={(e) => setWorshipTitle(e.target.value)}
            placeholder="Sunday Worship Service"
            disabled={loading}
          />
        </div>

        <div className="home-admin-images">
          <ImagePicker
            label="Left Picture"
            buttonLabel={mapButton || 'View Map & Directions'}
            imageUrl={leftImageUrl}
            file={leftFile}
            setFile={setLeftFile}
          />

          <ImagePicker
            label="Right Picture"
            buttonLabel={zoomButton || 'Join the Live Service'}
            imageUrl={rightImageUrl}
            file={rightFile}
            setFile={setRightFile}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label htmlFor="map-coords">Google Maps Location <span className="admin-form-hint">(coordinates, e.g. 14.847457, 120.977211)</span></label>
            <input
              id="map-coords"
              type="text"
              value={mapCoords}
              onChange={(e) => setMapCoords(e.target.value)}
              placeholder="14.847457, 120.977211"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="zoom-link">Zoom Meeting Link <span className="admin-form-hint">(paste the full Zoom join URL)</span></label>
            <input
              id="zoom-link"
              type="text"
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="https://us02web.zoom.us/j/..."
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="map-button">Map Button Text</label>
            <input
              id="map-button"
              type="text"
              value={mapButton}
              onChange={(e) => setMapButton(e.target.value)}
              placeholder="View Map & Directions"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="zoom-button">Zoom Button Text</label>
            <input
              id="zoom-button"
              type="text"
              value={zoomButton}
              onChange={(e) => setZoomButton(e.target.value)}
              placeholder="Join the Live Service"
              disabled={loading}
            />
          </div>
        </div>

        <hr className="admin-form-divider" />

        {/* Section 4: Testimonials */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Testimonials</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Set the heading and the video shown below it on the Home page.</p>

        <div className="home-admin-row">
          <div className="home-admin-preview">
            {replayLink && toEmbedUrl(replayLink) ? (
              <iframe
                src={toEmbedUrl(replayLink)}
                title={testimonialsTitle || 'Testimonials preview'}
                style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 8 }}
                allowFullScreen
              />
            ) : (
              <div className="home-admin-placeholder">Video preview appears here</div>
            )}
          </div>

          <div className="home-admin-fields">
            <div className="admin-form-group">
              <label htmlFor="testimonials-title">Heading</label>
              <input
                id="testimonials-title"
                type="text"
                value={testimonialsTitle}
                onChange={(e) => setTestimonialsTitle(e.target.value)}
                placeholder="Testimonials"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="replay-link">Testimonials Video (YouTube Link)</label>
              <input
                id="replay-link"
                type="text"
                value={replayLink}
                onChange={(e) => setReplayLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <hr className="admin-form-divider" />

        {/* Section 5: Connect Cards (International + Replay) */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>International &amp; Replay Cards</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Edit every piece of text in the two cards shown side by side on the Home page.</p>

        <div className="admin-form-grid">
          <div>
            <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem', color: '#2596be' }}>International Card</h3>

            <div className="admin-form-group">
              <label htmlFor="international-title">Heading</label>
              <input
                id="international-title"
                type="text"
                value={internationalTitle}
                onChange={(e) => setInternationalTitle(e.target.value)}
                placeholder="International Worship Service"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="international-body">Text <span className="admin-form-hint">(start a new line for each line)</span></label>
              <textarea
                id="international-body"
                value={internationalBody}
                onChange={(e) => setInternationalBody(e.target.value)}
                placeholder={'Los Angeles USA\nPhnom Penh Cambodia\nSydney Australia\n...'}
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="international-button">Button Text</label>
              <input
                id="international-button"
                type="text"
                value={internationalButton}
                onChange={(e) => setInternationalButton(e.target.value)}
                placeholder="See Our Fourth International Worship Service"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem', color: '#2596be' }}>Replay Card</h3>

            <div className="admin-form-group">
              <label htmlFor="replay-title">Heading</label>
              <input
                id="replay-title"
                type="text"
                value={replayTitle}
                onChange={(e) => setReplayTitle(e.target.value)}
                placeholder="Replay Worship Services"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="replay-body">Text <span className="admin-form-hint">(start a new line for each line)</span></label>
              <textarea
                id="replay-body"
                value={replayBody}
                onChange={(e) => setReplayBody(e.target.value)}
                placeholder="Watch archived communion lesson replays and get re-inspired by past series."
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="replay-button">Button Text</label>
              <input
                id="replay-button"
                type="text"
                value={replayButton}
                onChange={(e) => setReplayButton(e.target.value)}
                placeholder="Go to Prior Sunday Sermons and Lessons"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <hr className="admin-form-divider" />

        {/* Section 6: Empower & Connect */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Empower &amp; Connect</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Edit the heading, text, and button of the Empower & Connect section. The button links to the Contact page.</p>

        <div className="admin-form-group">
          <label htmlFor="empower-title">Heading</label>
          <input
            id="empower-title"
            type="text"
            value={empowerTitle}
            onChange={(e) => setEmpowerTitle(e.target.value)}
            placeholder="Empower & Connect"
            disabled={loading}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="empower-body">Text <span className="admin-form-hint">(start a new line for each paragraph)</span></label>
          <textarea
            id="empower-body"
            value={empowerBody}
            onChange={(e) => setEmpowerBody(e.target.value)}
            placeholder="Sometimes, life can make anyone feel powerless and disconnected..."
            disabled={loading}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="empower-button">Button Text</label>
          <input
            id="empower-button"
            type="text"
            value={empowerButton}
            onChange={(e) => setEmpowerButton(e.target.value)}
            placeholder="Contact Us to Find a Small Group"
            disabled={loading}
          />
        </div>

        <hr className="admin-form-divider" />

        {/* Section 7: Ministries & Events */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Ministries &amp; Events</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>
          Set the Ministries &amp; Upcoming Events titles and buttons. The four rotating photos on the Home page come
          from the <em>Manage Ministries</em> page; the calendar markers come from <em>Manage Calendar</em>.
        </p>

        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label htmlFor="ministries-title">Ministries Title</label>
            <input
              id="ministries-title"
              type="text"
              value={ministriesTitle}
              onChange={(e) => setMinistriesTitle(e.target.value)}
              placeholder="Ministries"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="events-title">Upcoming Events Title</label>
            <input
              id="events-title"
              type="text"
              value={eventsTitle}
              onChange={(e) => setEventsTitle(e.target.value)}
              placeholder="Upcoming Events"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="ministries-button">Ministries Button</label>
            <input
              id="ministries-button"
              type="text"
              value={ministriesButton}
              onChange={(e) => setMinistriesButton(e.target.value)}
              placeholder="View Ministries"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="events-button">Upcoming Events Button</label>
            <input
              id="events-button"
              type="text"
              value={eventsButton}
              onChange={(e) => setEventsButton(e.target.value)}
              placeholder="View Upcoming Events"
              disabled={loading}
            />
          </div>
        </div>

        <hr className="admin-form-divider" />

        {/* Section 8: Give & Video */}
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Give &amp; Video</h2>
        <p style={{ color: '#999', margin: '0 0 1rem' }}>Set the YouTube video and the button text on the Home page. The button links to the Give page.</p>

        <div className="home-admin-row">
          <div className="home-admin-preview">
            {giveLink && toEmbedUrl(giveLink) ? (
              <iframe
                src={toEmbedUrl(giveLink)}
                title="Give video preview"
                style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 8 }}
                allowFullScreen
              />
            ) : (
              <div className="home-admin-placeholder">Video preview appears here</div>
            )}
          </div>

          <div className="home-admin-fields">
            <div className="admin-form-group">
              <label htmlFor="give-link">Give Video (YouTube Link)</label>
              <input
                id="give-link"
                type="text"
                value={giveLink}
                onChange={(e) => setGiveLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="give-button">Give Button Text</label>
              <input
                id="give-button"
                type="text"
                value={giveButton}
                onChange={(e) => setGiveButton(e.target.value)}
                placeholder="Click here to find ways to give"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

const CoverCropEditor = ({ imageUrl, position, onChange }) => {
  const frameRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, startPos: { x: 50, y: 50 } })

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const parsePosition = (value) => {
    const [x = '50%', y = '50%'] = (value || '50% 50%').split(/\s+/)
    return {
      x: Number.parseFloat(x) || 50,
      y: Number.parseFloat(y) || 50,
    }
  }

  const safePosition = parsePosition(position)

  const updateFromPointer = (clientX, clientY) => {
    if (!frameRef.current) return

    const rect = frameRef.current.getBoundingClientRect()
    const dx = ((clientX - dragRef.current.startX) / rect.width) * 100
    const dy = ((clientY - dragRef.current.startY) / rect.height) * 100

    const nextX = clamp(dragRef.current.startPos.x + dx * 1.3, 0, 100)
    const nextY = clamp(dragRef.current.startPos.y + dy * 1.3, 0, 100)
    onChange(`${nextX.toFixed(1)}% ${nextY.toFixed(1)}%`)
  }

  const handlePointerDown = (event) => {
    if (!imageUrl) return
    event.preventDefault()
    setDragging(true)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startPos: parsePosition(position),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragging) return
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerUp = (event) => {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }

  if (!imageUrl) {
    return (
      <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid #dfeaf0', borderRadius: '12px', background: '#f9fbfc', color: '#7f8c8d', fontSize: '0.82rem' }}>
        Upload a cover image to adjust how it is framed on the public home page.
      </div>
    )
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#555' }}>Cover crop preview</span>
        <span style={{ fontSize: '0.75rem', color: '#6a7f8d' }}>Drag to pan</span>
      </div>
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1090 / 900',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #dfeaf0',
          background: '#eef6fb',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <img
          src={imageUrl}
          alt="Cover crop preview"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '120%',
            height: '120%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover',
            objectPosition: `${safePosition.x}% ${safePosition.y}%`,
            pointerEvents: 'none',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}

const ImagePicker = ({ label, buttonLabel, imageUrl, file, setFile, previewAspectRatio = '16 / 10', previewHelp = '', imageStyle = {} }) => {
  const [preview, setPreview] = useState('')
  const [dragging, setDragging] = useState(false)

  const acceptFile = (selected) => {
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      setFile(null)
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleFile = (e) => acceptFile(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const src = preview || imageUrl

  return (
    <div className="home-admin-image-card">
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.6rem', color: '#555' }}>{label}</h3>
      <label
        className={`image-upload-box${dragging ? ' image-upload-box--dragging' : ''}`}
        style={{ ['--preview-ratio' ]: previewAspectRatio }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
        }}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" onChange={handleFile} hidden />
        {src ? (
          <img src={src} alt={label} style={imageStyle} />
        ) : (
          <span className="image-upload-hint">Tap to choose, or drag & drop an image here</span>
        )}
      </label>
      <p className="image-upload-note">{file ? `${file.name} (pending upload)` : previewHelp || ''}</p>
      <p className="image-button-label">{buttonLabel}</p>
    </div>
  )
}

export default HomeAdmin
