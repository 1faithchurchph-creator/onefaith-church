import React, { useEffect, useRef } from 'react'
import { useMinistryContent } from '../lib/ministryContent'
import fallbackImg from '../assets/image.png'
import '../css/ministry.css'

// Serve images through Supabase's render/image transformation service instead of
// the raw uploads (which are multi-MB PNG screenshots). 1600px webp q75 is the
// largest candidate; ~550px wide on desktop, ~100vw on mobile.
const RENDER_WIDTHS = [600, 1000, 1600]

const renderUrl = (publicUrl, width) => {
  const marker = '/object/public/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return publicUrl
  const path = publicUrl.slice(idx + marker.length).split('?')[0]
  const params = new URLSearchParams({ width: String(width), quality: '75', format: 'webp', resize: 'contain' })
  return `${publicUrl.slice(0, idx)}/render/image/public/${path}?${params}`
}

const MinistryBlock = ({ map, n, reverse }) => {
  const kicker = map[`ministry_${n}_kicker`] || ''
  const title = map[`ministry_${n}_title`] || ''
  const text = map[`ministry_${n}_text`] || ''
  const rawImage = map[`ministry_${n}_image`] || ''

  const src = rawImage ? renderUrl(rawImage, 1000) : fallbackImg
  const srcSet = rawImage
    ? RENDER_WIDTHS.map((w) => `${renderUrl(rawImage, w)} ${w}w`).join(', ')
    : undefined

  return (
    <div className={`ministry-block${reverse ? ' ministry-block--reverse' : ''}`}>
      <div className="ministry-block__media">
        {kicker && <p className="ministry-block__kicker">{kicker}</p>}
        <img
          className="ministry-block__image"
          src={src}
          srcSet={srcSet}
          sizes="(min-width: 900px) 50vw, 100vw"
          alt={title || `Ministry ${n}`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="ministry-block__body">
        {title && <h2 className="ministry-block__title">{title}</h2>}
        {text &&
          text.split('\n').map((line, i) => (
            <p key={i} className="ministry-block__text">
              {line}
            </p>
          ))}
      </div>
    </div>
  )
}

const Ministries = () => {
  const { map, ready } = useMinistryContent()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!ready || !rootRef.current) return
    const blocks = rootRef.current.querySelectorAll('.ministry-block')
    if (!blocks.length) return

    const setup = () => {
      blocks.forEach((block) => block.classList.add('ministry-block--visible'))
    }

    if (typeof IntersectionObserver === 'undefined') {
      setup()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ministry-block--visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    blocks.forEach((block) => io.observe(block))
    return () => io.disconnect()
  }, [ready])

  if (!ready) return null

  return (
    <main className="ministry-page" ref={rootRef}>
      <h1 className="ministry-page__title">Join Our Ministry</h1>

      <section className="ministry-section">
        <MinistryBlock map={map} n={1} reverse={false} />
        <MinistryBlock map={map} n={2} reverse />
      </section>

      <section className="ministry-section ministry-section--alt">
        <MinistryBlock map={map} n={3} reverse={false} />
        <MinistryBlock map={map} n={4} reverse />
      </section>
    </main>
  )
}

export default Ministries