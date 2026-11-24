'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminDb as supabase } from '@/lib/adminDb'
import MediaUploadField from '@/shared/components/ui/MediaUploadField'
import AdminGuide from '@/shared/components/admin/AdminGuide'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NewPortfolioPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', slug: '', subtitle: '', category: 'Construction',
    location: '', year: new Date().getFullYear().toString(),
    image: '', before_image: '', after_image: '', video_url: '',
    description: '', full_description: '', budget: '',
    client: '', area: '', duration: '', featured: false, order_index: 0,
  })
  const [highlights, setHighlights] = useState([''])
  const [gallery, setGallery] = useState([''])
  const [team, setTeam] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleTitleChange = e => {
    const val = e.target.value
    set('title', val)
    if (!form.slug || form.slug === slugify(form.title)) set('slug', slugify(val))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!supabase) { setError('Supabase not configured.'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('portfolio_projects').insert([{
      ...form,
      highlights: highlights.filter(Boolean),
      gallery: gallery.filter(Boolean),
      team: team ? team.split(',').map(item => item.trim()).filter(Boolean) : [],
    }])
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/admin/portfolio')
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-colors'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/portfolio" className="text-gray-400 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
      </div>

      {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminGuide
          title="এই project site-এর কোথায় দেখাবে?"
          where="Portfolio page-এ একটা card হিসেবে (Cover Image + Title + Location), আর card-এ click করলে project-এর নিজস্ব page খোলে — সেখানে Before/After slider, Video, Gallery আর বিবরণ দেখায়। Featured দিলে homepage-এও দেখাবে।"
          demo="/admin-guide/portfolio-detail.jpg"
          view="/portfolio"
          steps={['Title আর Cover Image অবশ্যই দিন (* চিহ্ন দেওয়া)।', 'Before / After — একই জায়গার কাজের আগে ও পরের ছবি, একই size-এ। দুটো দিলে slider দেখাবে।', 'Gallery-তে কাজের আরো ছবি দিন।', 'শেষে নিচের Save button চাপুন।']}
        />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3">Basic Info</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Title *</label>
              <input required value={form.title} onChange={handleTitleChange} className={inputCls} placeholder="Modern Villa, Uttara" />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input required value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="modern-villa-uttara" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Subtitle</label>
            <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} className={inputCls} placeholder="Luxury Residential" />
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                <option>Construction</option>
                <option>Architecture</option>
                <option>Interior Design</option>
                <option>Renovation</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} className={inputCls} placeholder="Uttara, Dhaka" />
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input value={form.year} onChange={e => set('year', e.target.value)} className={inputCls} placeholder="2024" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Client</label>
              <input value={form.client} onChange={e => set('client', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Area</label>
              <input value={form.area} onChange={e => set('area', e.target.value)} className={inputCls} placeholder="3,200 sqft" />
            </div>
            <div>
              <label className={labelCls}>Duration</label>
              <input value={form.duration} onChange={e => set('duration', e.target.value)} className={inputCls} placeholder="14 months" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Budget</label>
              <input value={form.budget} onChange={e => set('budget', e.target.value)} className={inputCls} placeholder="৳ 45L" />
            </div>
            <div>
              <label className={labelCls}>Team Members</label>
              <input value={team} onChange={e => setTeam(e.target.value)} className={inputCls} placeholder="Architect, Site Engineer, Interior Designer" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3">Images</h2>
          <div>
            <label className={labelCls}>Cover Image *</label>
            <MediaUploadField
              label="Cover Image"
              hint="Portfolio card আর project page-এর উপরের বড় ছবি"
              value={form.image}
              onChange={(nextValue) => set('image', nextValue)}
              required
              className={inputCls}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Before Image</label>
              <MediaUploadField
                label="Before Image"
                hint="কাজ শুরুর আগের ছবি"
                value={form.before_image}
                onChange={(nextValue) => set('before_image', nextValue)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>After Image</label>
              <MediaUploadField
                label="After Image"
                hint="কাজ শেষের ছবি — Before-এর মতো একই angle থেকে"
                value={form.after_image}
                onChange={(nextValue) => set('after_image', nextValue)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Video</label>
            <MediaUploadField
              label="Project Video"
              kind="video"
              hint="ঐচ্ছিক — দিলে project page-এ video দেখাবে।"
              value={form.video_url}
              onChange={(nextValue) => set('video_url', nextValue)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Gallery Images</label>
            <p className="mb-3 text-xs text-gray-500">Project page-এর নিচে ছবির grid-এ দেখাবে। যত খুশি ছবি যোগ করুন।</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {gallery.map((url, i) => (
                <div key={i} className="relative rounded-xl border border-gray-100 p-2">
                  <p className="mb-1 text-[11px] font-semibold text-gray-400">ছবি {i + 1}</p>
                  <MediaUploadField
                    label="Gallery Image"
                    kind="image"
                    sizeContext="gallery"
                    value={url}
                    onChange={(next) => setGallery(g => g.map((v, j) => (j === i ? next : v)))}
                  />
                  {gallery.length > 1 && (
                    <button type="button" onClick={() => setGallery(g => g.filter((_, j) => j !== i))} className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="এই ঘর বাদ দিন"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setGallery(g => [...g, ''])} className="mt-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-2 text-sm font-semibold text-gold-700 hover:bg-gold-100">+ আরেকটা ছবি</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3">Description</h2>
          <div>
            <label className={labelCls}>Short Description</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className={labelCls}>Full Description</label>
            <textarea rows={5} value={form.full_description} onChange={e => set('full_description', e.target.value)} className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className={labelCls}>Highlights</label>
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={h} onChange={e => { const hs = [...highlights]; hs[i] = e.target.value; setHighlights(hs) }} className={inputCls} placeholder="Highlight point..." />
                <button type="button" onClick={() => setHighlights(hs => hs.filter((_, j) => j !== i))} className="text-gold-500 hover:text-gold-700 px-2" aria-label="Remove highlight"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setHighlights(h => [...h, ''])} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Highlight</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="featured" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-gold-500" />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured project</label>
          </div>
          <div>
            <label className={labelCls}>Display Order</label>
            <input type="number" value={form.order_index} onChange={e => set('order_index', +e.target.value)} className={inputCls + ' w-24'} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Project'}
          </button>
          <Link href="/admin/portfolio" className="text-sm text-gray-500 hover:text-gray-800">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
