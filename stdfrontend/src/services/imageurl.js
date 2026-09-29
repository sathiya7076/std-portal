const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
)
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '')

// FIXED: was '/placeholder-course.png' but no such file exists in /public
export const PLACEHOLDER_IMAGE = '/placeholder-course.svg'

export const getImageUrl = (img) => {
  if (!img) return PLACEHOLDER_IMAGE

  // Windows path fix: uploads\abc.jpg -> uploads/abc.jpg
  let path = String(img).replace(/\\/g, '/')

  if (/^(blob:|data:)/.test(path)) return path

  if (/^https?:\/\//.test(path)) {
    // localhost URL saved in DB -> replace with real backend URL
    return path.replace(/^https?:\/\/localhost:\d+/, API_BASE)
  }

  if (!path.startsWith('/')) path = '/' + path

  // FIXED (main bug): the deployed backend saves images as
  // "/api/courses/<id>/image". The old code only knew "/uploads", so it
  // turned that into "/uploads/api/courses/<id>/image" -> 404.
  // Paths that already start with /api or /uploads must be left untouched.
  if (!path.startsWith('/uploads') && !path.startsWith('/api')) {
    path = '/uploads' + path
  }

  return API_BASE + path
}