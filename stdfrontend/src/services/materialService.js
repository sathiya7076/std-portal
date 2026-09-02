import api, { mockDelay } from './api'
import { mockMaterials } from '../mock/mockData'

const USE_MOCK = false

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

// Backend wraps responses as { success, message, data, meta } via sendSuccess()
const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.materials)) return payload.materials
  if (Array.isArray(payload?.results)) return payload.results
  console.warn('Unexpected materials response shape:', payload)
  return []
}

const extractData = (payload) => {
  if (payload?.data !== undefined) return payload.data
  return payload
}

const materialService = {
  async getMaterialsByCourse(courseId) {
    if (USE_MOCK) return mockDelay(mockMaterials[courseId] || [])
    const { data } = await api.get(`/materials`, { params: { courseId } })
    return extractArray(data)
  },

  async getAllMaterials() {
    if (USE_MOCK) {
      const all = Object.entries(mockMaterials).flatMap(([courseId, items]) =>
        items.map((i) => ({ ...i, courseId }))
      )
      return mockDelay(all)
    }
    const { data } = await api.get('/materials')
    return extractArray(data)
  },

  async uploadMaterial(payload) {
    if (USE_MOCK) {
      return mockDelay({ ...payload, id: `m${Date.now()}`, uploadedDate: new Date().toISOString().slice(0, 10) }, 900)
    }
    const formData = new FormData()
    formData.append('courseId', payload.courseId)
    formData.append('title', payload.title)
    formData.append('description', payload.description)
    formData.append('type', payload.format.toUpperCase())
    formData.append('file', payload.file)

    // Do NOT manually set Content-Type here — axios needs to generate the
    // multipart boundary itself, or the backend can't parse the body and
    // every field (including courseId) arrives empty.
    const { data } = await api.post('/materials', formData)
    return extractData(data)
  },

  async deleteMaterial(id) {
    if (USE_MOCK) return mockDelay({ success: true, id }, 400)
    const { data } = await api.delete(`/materials/${id}`)
    return data
  },

  resolveFileUrl(fileUrl) {
    if (!fileUrl) return null
    return fileUrl.startsWith('http') ? fileUrl : `${FILE_BASE_URL}${fileUrl}`
  },
}

export default materialService