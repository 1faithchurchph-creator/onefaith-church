import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toEmbedUrl } from '../lib/youtube'
import { dateKey, expandDates } from '../lib/calendar'
import { useHomeContent } from '../lib/homeContent'
import { useMinistryContent } from '../lib/ministryContent'
import { useScrollReveal } from '../lib/reveal'
import { supabase } from '../lib/supabase'
import logo from '../assets/image2.png'
import imageA from '../assets/image.png'
import imageB from '../assets/image2.png'
import iconImg from '../assets/icon.png'
import '../css/home.css'

const Tagline = () => {
    const { map, ready } = useHomeContent()
    if (!ready) return null

    const image = map['tagline_image'] || logo
    const heading = map['tagline_heading'] || 'Welcome to One Faith Church in Christ Philippines'
    const body = map['tagline_body'] || 'Come experience the faith and love of Jesus and the resurrection power of the Holy Spirit.'

    return (
        <section className="home-tagline">
            <div className="home-tagline__image" data-reveal="left">
                <img src={image} alt="One Faith Church logo" />
            </div>

            <div className="home-tagline__text" data-reveal="right" style={{ animationDelay: '0.15s' }}>
                <h1>{heading}</h1>
                <p>{body}</p>
            </div>
        </section>
    )
}

const ReviewSection = () => {
    const { map, ready } = useHomeContent()
    if (!ready) return null

    const embedUrl = toEmbedUrl(map['review_2025_youtube'] || '')
    if (!embedUrl) return null

    const title = map['review_title'] || ''

    return (
        <section className="review-section">
            <h2 className="review-title" data-reveal="up">{title}</h2>
            <div className="review-container" data-reveal="up" style={{ animationDelay: '0.15s' }}>
                <iframe
                    className="review-video"
                    src={embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </section>
    )
}

const WorshipSection = () => {
    const { map, ready } = useHomeContent()

    const title = map['worship_title'] || ''
    const leftImage = map['worship_image_left'] || ''
    const rightImage = map['worship_image_right'] || ''
    const mapCoords = map['worship_map_coords'] || ''
    const zoomLink = map['worship_zoom_link'] || ''
    const mapButton = map['worship_map_button'] || ''
    const zoomButton = map['worship_zoom_button'] || ''

    if (!ready || (!leftImage && !rightImage)) return null

    const mapsUrl = mapCoords ? `https://www.google.com/maps?q=${encodeURIComponent(mapCoords)}` : ''

    return (
        <section className="worship-section">
            <div className="worship-inner">
                <div className="section-heading" data-reveal="up">
                    <span className="section-heading__tag">Join Us</span>
                    <h2 className="section-heading__title">{title}</h2>
                </div>
                <div className="worship-cards">
                    {leftImage && (
                        <div className="worship-card" data-reveal="left">
                            <div className="worship-card__media">
                                <img src={leftImage} alt="One Faith Church location" />
                            </div>
                            <div className="worship-card__body">
                                {mapsUrl && (
                                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="worship-button worship-button--map">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {mapButton || 'View Map & Directions'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    {rightImage && (
                        <div className="worship-card" data-reveal="right" style={{ animationDelay: '0.15s' }}>
                            <div className="worship-card__media">
                                <img src={rightImage} alt="One Faith Church Zoom service" />
                            </div>
                            <div className="worship-card__body">
                                {zoomLink && (
                                    <a href={zoomLink} target="_blank" rel="noopener noreferrer" className="worship-button worship-button--zoom">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="m22 8-6 4 6 4V8Z" />
                                            <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
                                        </svg>
                                        {zoomButton || 'Join the Live Service'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

const TestimonialsSection = () => {
    const { map, ready } = useHomeContent()
    if (!ready) return null

    const embedUrl = toEmbedUrl(map['replay_youtube'] || '')
    if (!embedUrl) return null

    const title = map['testimonials_title'] || ''

    return (
        <section className="review-section">
            <h2 className="review-title" data-reveal="up">{title}</h2>
            <div className="review-container" data-reveal="up" style={{ animationDelay: '0.15s' }}>
                <iframe
                    className="review-video"
                    src={embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </section>
    )
}

const ConnectSection = () => {
    const { map, ready } = useHomeContent()

    const INTL_DEFAULT =
        'Los Angeles USA • Manila Philippines\n' +
        'Phnom Penh Cambodia • Sydney Australia\n' +
        'Re-experience our fourth international service\n' +
        'Christ: Mission, Message, Mutuality, Ministry. God is moving!'
    const REPLAY_DEFAULT = 'Watch archived communion lesson replays and get re-inspired by past series.'

    const internationalTitle = map['international_title'] || 'International Worship Service'
    const internationalBody = map['international_body'] || INTL_DEFAULT
    const internationalButton = map['international_button'] || 'See Our Fourth International Worship Service'
    const replayTitle = map['replay_title'] || 'Replay Worship Services'
    const replayBody = map['replay_body'] || REPLAY_DEFAULT
    const replayButton = map['replay_button'] || 'Go to Prior Sunday Sermons and Lessons'

    if (!ready) return null

    const intlLines = internationalBody.split('\n').filter((l) => l.trim() !== '')
    const replayLines = replayBody.split('\n').filter((l) => l.trim() !== '')

    return (
        <section className="connect-section">
            <div className="worship-inner">
                <div className="connect-cards">
                    <div className="connect-card" data-reveal="left">
                        <h3 className="connect-card__title">{internationalTitle}</h3>
                        <div className="connect-card__text">
                            {intlLines.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                        <Link to="/international" className="connect-card__button">
                            {internationalButton}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    <div className="connect-card" data-reveal="right" style={{ animationDelay: '0.15s' }}>
                        <h3 className="connect-card__title">{replayTitle}</h3>
                        <div className="connect-card__text">
                            {replayLines.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                        <Link to="/sermons" className="connect-card__button">
                            {replayButton}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

const EmpowerSection = () => {
    const { map, ready } = useHomeContent()

    const DEFAULT_BODY =
        'Sometimes, life can make anyone feel powerless and disconnected. One Faith and Christ’s love empower and connect us through the work of the spirit. We need spiritual strength to meet the challenges that each state of life brings, so we host regular Faith Team meetings by life stage. Feel free to check one out!'

    const title = map['empower_title'] || 'Empower & Connect'
    const body = map['empower_body'] || DEFAULT_BODY
    const button = map['empower_button'] || 'Contact Us to Find a Small Group'

    if (!ready) return null

    const lines = body.split('\n').filter((l) => l.trim() !== '')

    return (
        <section className="empower-section">
            <div className="worship-inner">
                <h2 className="empower-title" data-reveal="up">{title}</h2>
                <div className="empower-body" data-reveal="up" style={{ animationDelay: '0.12s' }}>
                    {lines.map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
                <Link to="/contact" className="empower-button" data-reveal="up" style={{ animationDelay: '0.24s' }}>
                    {button}
                </Link>
            </div>
        </section>
    )
}

const MonthCalendar = ({ eventKeys = new Set() }) => {
    const now = new Date()
    const [viewYear, setViewYear] = useState(now.getFullYear())
    const [viewMonth, setViewMonth] = useState(now.getMonth())
    const today = now.getDate()
    const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate())

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

    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < firstWeekday; i++) {
        cells.push(<div key={`blank-${i}`} className="home-calendar__day" />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const key = dateKey(viewYear, viewMonth, day)
        const hasEvent = key >= todayKey && eventKeys.has(key)
        cells.push(
            <div
                key={day}
                className={`home-calendar__day${isCurrentMonth && day === today ? ' home-calendar__day--today' : ''}${hasEvent ? ' home-calendar__day--events' : ''}`}
            >
                <span className="num">{day}</span>
            </div>
        )
    }

    return (
        <div className="home-calendar">
            <div className="home-calendar__header">
                <button type="button" className="home-calendar__nav" aria-label="Previous month" onClick={prevMonth}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <span className="home-calendar__label">{monthLabel}</span>
                <button type="button" className="home-calendar__nav" aria-label="Next month" onClick={nextMonth}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>
            <div className="home-calendar__grid">
                {weekdays.map((d) => (
                    <div key={d} className="home-calendar__weekday">
                        {d}
                    </div>
                ))}
                {cells}
            </div>
        </div>
    )
}

const EventsMinistriesSection = () => {
    const home = useHomeContent()
    const ministry = useMinistryContent()
    const [index, setIndex] = useState(0)
    const [events, setEvents] = useState([])

    useEffect(() => {
        let active = true
        supabase
            .from('calendar_events')
            .select('*')
            .then(({ data, error }) => {
                if (active && !error && data) setEvents(data)
            })
            .catch(() => {})
        return () => {
            active = false
        }
    }, [])

    const eventKeys = useMemo(() => {
        const keys = new Set()
        for (const e of events) {
            for (const k of expandDates(e.event_date, e.end_date)) keys.add(k)
        }
        return keys
    }, [events])

    const { map } = home
    const FALLBACK_IMAGES = [imageA, imageB, iconImg]
    const ministryImages = [
        ministry.map['ministry_1_image'] || '',
        ministry.map['ministry_2_image'] || '',
        ministry.map['ministry_3_image'] || '',
        ministry.map['ministry_4_image'] || '',
    ]
    const images = ministryImages.map((src, i) => src || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length])
    const ministriesTitle = map['ministries_title'] || 'Ministries'
    const ministriesButton = map['ministries_button'] || 'View Ministries'
    const eventsTitle = map['events_title'] || 'Upcoming Events'
    const eventsButton = map['events_button'] || 'View Upcoming Events'

    useEffect(() => {
        if (images.length < 2) return
        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % images.length)
        }, 3000)
        return () => clearInterval(timer)
    }, [images.length])

    if (!home.ready || !ministry.ready) return null

    return (
        <section className="events-ministries-section">
            <div className="worship-inner">
                <div className="events-ministries-grid">
                    <div className="ministries-card" data-reveal="left">
                        <h3 className="ministries-card__title">{ministriesTitle}</h3>
                        <div className="ministries-carousel">
                            {images.map((src, i) => (
                                <div
                                    key={i}
                                    className={`ministries-slide${i === index ? ' ministries-slide--active' : ''}`}
                                >
                                    <img src={src} alt={`Ministry photo ${i + 1}`} />
                                </div>
                            ))}
                        </div>
                        <div className="ministries-carousel__dots">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Show ministry photo ${i + 1}`}
                                    className={`dot${i === index ? ' dot--active' : ''}`}
                                    onClick={() => setIndex(i)}
                                />
                            ))}
                        </div>
                        <Link to="/ministries" className="ministries-card__button">
                            {ministriesButton}
                        </Link>
                    </div>
                    <div className="events-card" data-reveal="right" style={{ animationDelay: '0.15s' }}>
                        <h3 className="events-card__title">{eventsTitle}</h3>
                        <MonthCalendar eventKeys={eventKeys} />
                        <Link to="/calendar" className="events-card__button">
                            {eventsButton}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

const GiveSection = () => {
    const { map, ready } = useHomeContent()
    if (!ready) return null

    const embedUrl = toEmbedUrl(map['give_youtube'] || '')
    const buttonText = map['give_button'] || 'Click here to find ways to give'

    return (
        <section className="give-section">
            <div className="worship-inner">
                <div className="give-grid">
                    <div className="give-video-wrap" data-reveal="left">
                        {embedUrl ? (
                            <iframe
                                className="give-video"
                                src={embedUrl}
                                title="Ways to give"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="give-video-placeholder">Give video will appear here</div>
                        )}
                    </div>
                    <div className="give-card" data-reveal="right" style={{ animationDelay: '0.15s' }}>
                        <Link to="/give" className="give-button">
                            {buttonText}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

const Home = () => {
    const rootRef = useRef(null)
    useScrollReveal(rootRef)

    return (
        <main className="home-page" ref={rootRef}>
            <Tagline />
            <ReviewSection />
            <WorshipSection />
            <TestimonialsSection />
            <ConnectSection />
            <EmpowerSection />
            <EventsMinistriesSection />
            <div className="home-divider" />
            <GiveSection />
        </main>
    )
}

export default Home
