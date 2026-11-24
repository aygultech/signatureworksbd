// Plays an uploaded video file natively, or embeds a YouTube link (older saved content).
export function getYouTubeEmbed(url = '') {
  if (url.includes('youtube.com/watch?v=')) return `https://www.youtube.com/embed/${url.split('v=')[1].split('&')[0]}`
  if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`
  if (url.includes('youtube.com/embed/')) return url
  return ''
}

export default function VideoPlayer({ src, title, className = 'h-full w-full' }) {
  if (!src) return null
  const embed = getYouTubeEmbed(src)
  if (embed) {
    return (
      <iframe
        src={embed}
        title={title}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }
  return <video src={src} title={title} className={`${className} object-contain`} controls playsInline preload="metadata" />
}
