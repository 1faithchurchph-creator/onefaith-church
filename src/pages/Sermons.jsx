import React from 'react'
import { useSermonsContent } from '../lib/sermonsContent'
import { toEmbedUrl } from '../lib/youtube'
import '../css/sermons.css'

export default function Sermons() {
  const { map, ready } = useSermonsContent()

  if (!ready) {
    return <div className="sermons-page">Loading...</div>
  }

  const title = map['sermons_title'] || 'Sermons'
  const subheading = map['sermons_subheading'] || ''
  const youtubeLink = map['sermons_youtube_link'] || ''
  const embedUrl = toEmbedUrl(youtubeLink)

  return (
    <main className="sermons-page">
      <header className="sermons-header">
        <h1 className="sermons-title">{title}</h1>
        {subheading && <p className="sermons-subheading">{subheading}</p>}
      </header>

      {embedUrl ? (
        <div className="video-container">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="video-placeholder">
          <p>No sermon video available at the moment.</p>
        </div>
      )}
    </main>
  )
}
