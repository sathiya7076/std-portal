const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
)
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '')

export const PLACEHOLDER_IMAGE = '/placeholder-course.png'

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
  if (!path.startsWith('/uploads')) path = '/uploads' + path
  return API_BASE + path
}