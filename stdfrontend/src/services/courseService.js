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
      const newCourse = {
        students: 0, // no students enrolled yet
        ...payload,
        id: payload.id || `c${Date.now()}`,
      }
      mockCourses.push(newCourse)
      saveCourses(mockCourses) // 👈 persist immediately
      return mockDelay(newCourse, 700)
    }
    const { data } = await api.post('/courses', payload)
    return extractData(data)
  },

  async updateCourse(id, payload) {
    if (USE_MOCK) {
      mockCourses = mockCourses.map((c) => (c.id === id ? { ...c, ...payload } : c))
      saveCourses(mockCourses)
      return mockDelay(mockCourses.find((c) => c.id === id), 600)
    }
    const { data } = await api.put(`/courses/${id}`, payload)
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