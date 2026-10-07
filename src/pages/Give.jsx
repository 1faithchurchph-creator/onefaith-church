import React, { useRef } from 'react'
import { useGiveContent } from '../lib/giveContent'
import { useScrollReveal } from '../lib/reveal'
import fallbackImg from '../assets/image.png'
import '../css/give.css'

const DEFAULTS = {
  give_hero_title: 'Give',
  give_verse_text: '"God loves a cheerful giver."',
  give_verse_ref: '2 Corinthians 9:7',
  give_scan_note: 'Scan with GCash, Maya, or your bank app',
}

const parseQrCodes = (raw) => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object' && x.image)
        .map((x) => ({ label: typeof x.label === 'string' ? x.label : '', image: x.image }))
    }
  } catch {
    // fall through
  }
  // Backwards compat: previously a single give_qr_image URL was stored.
  return typeof raw === 'string' && raw.trim() ? [{ label: '', image: raw }] : []
}

const parseCards = (raw) => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object' && (x.title || x.body))
        .map((x) => ({
          title: typeof x.title === 'string' ? x.title : '',
          body: typeof x.body === 'string' ? x.body : '',
        }))
    }
  } catch {
    // fall through
  }
  return []
}

const Give = () => {
  const { map, ready } = useGiveContent()
  const rootRef = useRef(null)
  useScrollReveal(rootRef)

  if (!ready) return null

  const get = (k) => (map[k] && map[k].trim() ? map[k] : DEFAULTS[k] || '')
  const qrCodes = parseQrCodes(map['give_qr_codes'])
  const cards = parseCards(map['give_cards'])

  return (
    <div className="give-page" ref={rootRef}>
      <section className="give-hero" data-reveal="up">
        <h1 className="give-hero__title">{get('give_hero_title')}</h1>
        <p className="give-hero__verse">{get('give_verse_text')}</p>
        <span className="give-hero__verse-ref">{get('give_verse_ref')}</span>
      </section>

      <section className="give-qr" data-reveal="up" style={{ animationDelay: '0.15s' }}>
        <p className="give-qr__scan-note">{get('give_scan_note')}</p>

        {qrCodes.length > 0 ? (
          <div className="give-qr__row">
            {qrCodes.map((qr, i) => (
              <figure className="give-qr__item" key={i}>
                <div className="give-qr__frame">
                  <img
                    src={qr.image}
                    alt={qr.label ? `${qr.label} QR code` : 'Giving QR code'}
                    className="give-qr__image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {qr.label && <figcaption className="give-qr__label">{qr.label}</figcaption>}
              </figure>
            ))}
          </div>
        ) : (
          <div className="give-qr__row">
            <figure className="give-qr__item">
              <div className="give-qr__frame">
                <img
                  src={fallbackImg}
                  alt="Giving"
                  className="give-qr__image give-qr__image--fallback"
                />
              </div>
            </figure>
          </div>
        )}
      </section>

      {cards.length > 0 && (
        <section className="give-cards">
          {cards.map((card, i) => (
            <article
              key={i}
              className="give-card"
              data-reveal="up"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <h3 className="give-card__title">{card.title}</h3>
              <p className="give-card__body">{card.body}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default Give
