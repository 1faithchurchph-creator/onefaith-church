export function toEmbedUrl(url) {
  if (!url) return ''

  const trimmed = url.trim()

  const embedMatch = trimmed.match(
    /^(?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([\w-]{6,})/
  )
  if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`

  const watchMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/
  )
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`

  return null
}
