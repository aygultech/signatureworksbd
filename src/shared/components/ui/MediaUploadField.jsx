'use client'

// Upload-only media picker for the admin panel. The owner never types or pastes a link:
// they upload a file (or pick one already in the Media Library) and the public URL is stored.
import { useEffect, useRef, useState } from 'react'
import { adminDb as supabase } from '@/lib/adminDb'
import { getImageSizeGuide, readImageDimensions, checkImageAgainstGuide } from '@/lib/imageSizeGuide'

const BUCKET = 'site-media'
const MAX_IMAGE_MB = 10
const MAX_VIDEO_MB = 50 // Supabase free-plan per-file limit
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif)(\?|$)/i

function detectKind(label = '', value = '', kind) {
  if (kind) return kind
  if (String(label).toLowerCase().includes('video') || VIDEO_EXT.test(value)) return 'video'
  return 'image'
}

const isYouTube = (url = '') => /youtube\.com|youtu\.be/.test(url)

function fileNameFromUrl(url = '') {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]) } catch { return url }
}

function LibraryPicker({ kind, onPick, onClose }) {
  const [files, setFiles] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.storage.from(BUCKET).list().then(({ data, error: listError }) => {
      if (listError) { setError(listError.message); setFiles([]); return }
      const re = kind === 'video' ? VIDEO_EXT : IMAGE_EXT
      setFiles((data || []).filter(f => re.test(f.name)))
    })
  }, [kind])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <p className="font-semibold text-gray-900">Media Library থেকে বেছে নিন</p>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100">Close</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {files === null && <p className="text-sm text-gray-500">Loading…</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {files?.length === 0 && !error && <p className="text-sm text-gray-500">এখনো কোনো {kind === 'video' ? 'video' : 'ছবি'} upload করা হয়নি।</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files?.map(f => {
              const url = supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl
              return (
                <button key={f.name} type="button" onClick={() => onPick(url)}
                  className="overflow-hidden rounded-xl border border-gray-200 text-left hover:border-gold-400 hover:ring-2 hover:ring-gold-300">
                  {kind === 'video'
                    ? <video src={url} className="h-28 w-full bg-black object-cover" muted preload="metadata" />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={url} alt="" loading="lazy" className="h-28 w-full object-cover" />}
                  <p className="truncate px-2 py-1 text-[10px] text-gray-500">{f.name.split('/').pop()}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MediaUploadField({
  label,
  value,
  onChange,
  required = false,
  hint,
  sizeContext,
  kind, // 'image' | 'video' — guessed from the label when omitted
}) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState([])
  const [picking, setPicking] = useState(false)

  const mediaKind = detectKind(label, value || '', kind)
  const accept = mediaKind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml'
  const sizeGuide = mediaKind === 'video' ? null : getImageSizeGuide(sizeContext || label)

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    if (!supabase) { setError('Storage is not configured.'); return }

    const isVideo = file.type.startsWith('video/')
    if (mediaKind === 'video' && !isVideo) { setError('এখানে শুধু video file (MP4) দিন।'); return }
    if (mediaKind === 'image' && !file.type.startsWith('image/')) { setError('এখানে শুধু ছবি (JPG/PNG/WebP) দিন।'); return }
    const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB
    if (file.size > limit * 1024 * 1024) {
      setError(`File অনেক বড় (${(file.size / 1024 / 1024).toFixed(1)} MB)। সর্বোচ্চ ${limit} MB। ${isVideo ? 'handbrake.fr দিয়ে compress করুন।' : 'squoosh.app দিয়ে compress করুন।'}`)
      return
    }

    setUploading(true)
    setError('')
    setWarnings(isVideo ? [] : checkImageAgainstGuide(await readImageDimensions(file), sizeGuide, file.size))

    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file'
    const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
    const filePath = `${Date.now()}-${base}.${extension}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file)
    setUploading(false)
    if (uploadError) { setError(`Upload হয়নি: ${uploadError.message}`); return }

    onChange(supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl)
  }

  const btn = 'rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60'
  const uploadLabel = uploading ? 'Uploading…' : mediaKind === 'video' ? '⬆ Video upload করুন' : '⬆ ছবি upload করুন'

  return (
    <div className="space-y-2">
      <div className={`overflow-hidden rounded-xl border-2 border-dashed p-3 ${value ? 'border-slate-200 bg-slate-50' : 'border-gold-300 bg-gold-50/40'}`}>
        {value ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:w-44">
              {mediaKind === 'video' ? (
                isYouTube(value)
                  ? <div className="flex h-full items-center justify-center text-xs text-slate-600">YouTube video</div>
                  : <video src={value} controls preload="metadata" className="h-full w-full bg-black object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt={label || 'Preview'} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-xs text-slate-500" title={fileNameFromUrl(value)}>✅ {fileNameFromUrl(value)}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`${btn} bg-gold-500 text-navy-950 hover:bg-gold-400`}>
                  {uploading ? 'Uploading…' : 'Replace (নতুন upload)'}
                </button>
                <button type="button" onClick={() => setPicking(true)} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}>
                  Library থেকে
                </button>
                {!required && (
                  <button type="button" onClick={() => { onChange(''); setWarnings([]) }} className={`${btn} border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <p className="text-sm text-slate-600">{mediaKind === 'video' ? '🎬 এখনো কোনো video নেই' : '🖼️ এখনো কোনো ছবি নেই'}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`${btn} bg-gold-500 text-navy-950 hover:bg-gold-400`}>
                {uploadLabel}
              </button>
              <button type="button" onClick={() => setPicking(true)} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}>
                Library থেকে বেছে নিন
              </button>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />
        {/* Keeps native "required" form validation working without a visible URL box. */}
        {required && <input tabIndex={-1} aria-hidden="true" required value={value || ''} onChange={() => {}} className="sr-only" />}
      </div>

      {sizeGuide && <p className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800">📐 {sizeGuide.text}</p>}
      {mediaKind === 'video' && <p className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800">🎬 MP4 · landscape 1920×1080 (16:9) · সর্বোচ্চ {MAX_VIDEO_MB} MB · ১–২ মিনিট রাখা ভালো</p>}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {warnings.map((w) => <p key={w} className="text-xs font-medium text-amber-700">⚠ {w}</p>)}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

      {picking && (
        <LibraryPicker kind={mediaKind} onClose={() => setPicking(false)} onPick={(url) => { onChange(url); setPicking(false); setWarnings([]) }} />
      )}
    </div>
  )
}
