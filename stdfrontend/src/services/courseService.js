import api, { mockDelay } from './api'
import { mockCourses as seedCourses } from '../mock/mockData'

const USE_MOCK = false
const STORAGE_KEY = 'stms_mockCourses_v1'

// ---- Persistent mock course store (backed by localStorage) ----
// Only used as a local dev fallback when USE_MOCK is true.
const loadCourses = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.warn('Failed to parse stored courses, falling back to seed data.', err)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCourses))
  return [...seedCourses]
}

const saveCourses = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to save courses to localStorage.', err)
  }
}

let mockCourses = USE_MOCK ? loadCourses() : []
// ------------------------------------------------------------------

// Backend wraps responses as { success, message, data, meta } via sendSuccess()
const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  console.warn('Unexpected courses response shape:', payload)
  return []
}

const extractData = (payload) => {
  if (payload?.data !== undefined) return payload.data
  return payload
}

// FIXED: if the caller already built a FormData object (e.g. TrainerCourses.jsx
// does this itself when handling the image file), use it directly instead of
// trying to destructure it — destructuring a FormData instance silently drops
// all its fields, which was causing "Name, duration, and fees are required".
const buildCoursePayload = (payload) => {
  if (payload instanceof FormData) return payload

  const { imageFile, ...rest } = payload
  if (!imageFile) return rest

  const formData = new FormData()
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value)
  })
  formData.append('image', imageFile)
  return formData
}

const courseService = {
  async getAllCourses() {
    if (USE_MOCK) return mockDelay([...mockCourses])
    const { data } = await api.get('/courses')
    return extractArray(data)
  },

  async getCourseById(id) {
    if (USE_MOCK) return mockDelay(mockCourses.find((c) => c.id === id) || null)
    const { data } = await api.get(`/courses/${id}`)
    return extractData(data)
  },

  async createCourse(payload) {
    if (USE_MOCK) {
      const { imageFile, ...rest } = payload instanceof FormData ? {} : payload
      const newCourse = {
        students: 0,
        ...rest,
        image: imageFile ? URL.createObjectURL(imageFile) : rest.image,
        id: rest.id || `c${Date.now()}`,
      }
      mockCourses.push(newCourse)
      saveCourses(mockCourses)
      return mockDelay(newCourse, 700)
    }
    const body = buildCoursePayload(payload)
    const { data } = await api.post('/courses', body, body instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined)
    return extractData(data)
  },

  async updateCourse(id, payload) {
    if (USE_MOCK) {
      const { imageFile, ...rest } = payload instanceof FormData ? {} : payload
      const patch = imageFile ? { ...rest, image: URL.createObjectURL(imageFile) } : rest
      mockCourses = mockCourses.map((c) => (c.id === id ? { ...c, ...patch } : c))
      saveCourses(mockCourses)
      return mockDelay(mockCourses.find((c) => c.id === id), 600)
    }
    const body = buildCoursePayload(payload)
    const { data } = await api.put(`/courses/${id}`, body, body instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined)
    return extractData(data)
  },

  async deleteCourse(id) {
    if (USE_MOCK) {
      mockCourses = mockCourses.filter((c) => c.id !== id)
      saveCourses(mockCourses)
      return mockDelay({ success: true, id }, 500)
    }
    const { data } = await api.delete(`/courses/${id}`)
    return extractData(data)
  },
}

export default courseService