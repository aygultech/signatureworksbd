// Recommended upload sizes for every image slot in the admin panel.
// `context` is the field label plus (for Full CMS) its parent path, e.g. "heroSlides 0 image".

const GUIDES = [
  { match: /hero|slide|banner/, w: 1920, h: 1080, ratio: '16:9', use: 'full-screen hero background' },
  { match: /before|after/, w: 1600, h: 1200, ratio: '4:3', use: 'before/after comparison (both images same size)' },
  { match: /gallery/, w: 1600, h: 1200, ratio: '4:3', use: 'project gallery' },
  { match: /avatar|testimonial|team|member|photo|profile/, w: 400, h: 400, ratio: '1:1 (square)', use: 'person photo' },
  { match: /logo/, w: 640, h: 150, ratio: 'wide, transparent PNG', use: 'logo' },
  { match: /icon/, w: 128, h: 128, ratio: '1:1, PNG/SVG', use: 'icon' },
  { match: /blog|post|article/, w: 1200, h: 630, ratio: '1.91:1', use: 'blog cover + social share preview' },
  { match: /about/, w: 1200, h: 900, ratio: '4:3', use: 'about section image' },
  { match: /service/, w: 1200, h: 800, ratio: '3:2', use: 'service card image' },
  { match: /cover|portfolio|project/, w: 1600, h: 1000, ratio: '16:10', use: 'project cover / card' },
]

const DEFAULT_GUIDE = { w: 1200, h: 800, ratio: '3:2', use: 'section image' }

export function getImageSizeGuide(context = '') {
  const normalized = String(context).toLowerCase().replace(/[_-]+/g, ' ')
  if (/video|href|link|url$/.test(normalized) && !/image|photo|avatar|logo|icon|cover|before|after|gallery/.test(normalized)) return null
  const guide = GUIDES.find((g) => g.match.test(normalized)) || DEFAULT_GUIDE
  return {
    ...guide,
    text: `Recommended: ${guide.w} × ${guide.h}px (${guide.ratio}) · JPG/WebP, max 1 MB · ${guide.use}`,
  }
}

// Reads the real pixel size of a picked file so the admin can be warned before saving.
export function readImageDimensions(file) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith('image/') || file.type === 'image/svg+xml') return resolve(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { resolve(null); URL.revokeObjectURL(url) }
    img.src = url
  })
}

export function checkImageAgainstGuide(dims, guide, bytes) {
  const warnings = []
  if (dims && guide) {
    if (dims.w < guide.w * 0.75 || dims.h < guide.h * 0.75) {
      warnings.push(`Image is ${dims.w} × ${dims.h}px — smaller than recommended ${guide.w} × ${guide.h}px, may look blurry.`)
    }
    const want = guide.w / guide.h
    const got = dims.w / dims.h
    if (Math.abs(got - want) / want > 0.2) {
      warnings.push(`Shape differs from ${guide.ratio}; edges may be cropped.`)
    }
  }
  if (bytes > 1024 * 1024) {
    warnings.push(`File is ${(bytes / 1024 / 1024).toFixed(1)} MB — compress under 1 MB for faster loading.`)
  }
  return warnings
}
