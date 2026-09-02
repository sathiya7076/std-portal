import api, { mockDelay } from './api'
import {
  mockUsers,
  mockAttendance,
  mockLearningProgress,
  mockStudents as seedStudents,
} from '../mock/mockData'

const USE_MOCK = true
const STORAGE_KEY = 'stms_mockStudents_v1'

// ---- Persistent mock student store (backed by localStorage) ----
const loadStudents = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.warn('Failed to parse stored students, falling back to seed data.', err)
  }
  // First run (or corrupted storage): seed from mockData and persist it
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedStudents))
  return [...seedStudents]
}

const saveStudents = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to save students to localStorage.', err)
  }
}

let mockStudents = loadStudents()
// ------------------------------------------------------------------

const studentService = {
  async getProfile() {
    if (USE_MOCK) return mockDelay({ ...mockUsers.student })
    const { data } = await api.get('/students/me')
    return data
  },

  async updateProfile(payload) {
    if (USE_MOCK) return mockDelay({ ...mockUsers.student, ...payload })
    const { data } = await api.put('/students/me', payload)
    return data
  },

  async getAttendance() {
    if (USE_MOCK) return mockDelay({ ...mockAttendance })
    const { data } = await api.get('/students/me/attendance')
    return data
  },

  async getLearningProgress() {
    if (USE_MOCK) return mockDelay([...mockLearningProgress])
    const { data } = await api.get('/students/me/progress')
    return data
  },

  async registerFingerprint() {
    if (USE_MOCK) return mockDelay({ success: true }, 1800)
    const { data } = await api.post('/students/me/fingerprint')
    return data
  },

  async getAllStudents({ search = '', course = '', sortBy = 'name' } = {}) {
    if (USE_MOCK) {
      let list = [...mockStudents]
      if (search) {
        const q = search.toLowerCase()
        list = list.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.id || '').toLowerCase().includes(q)
        )
      }
      if (course) list = list.filter((s) => s.course === course)
      list.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1))
      return mockDelay(list)
    }
    const { data } = await api.get('/students', { params: { search, course, sortBy } })
    return data
  },

  async getStudentById(id) {
    if (USE_MOCK) {
      const student = mockStudents.find((s) => s.id === id)
      return mockDelay(student ? { ...student, ...mockAttendance } : null)
    }
    const { data } = await api.get(`/students/${id}`)
    return data
  },

  async createStudent(payload) {
    if (USE_MOCK) {
      const newStudent = {
        ...payload,
        id: payload.id || `STU${Math.floor(Math.random() * 900 + 100)}`,
      }
      mockStudents.push(newStudent)
      saveStudents(mockStudents) // 👈 persist immediately
      return mockDelay(newStudent, 700)
    }
    const { data } = await api.post('/students', payload)
    return data
  },

  async deleteStudent(id) {
    if (USE_MOCK) {
      mockStudents = mockStudents.filter((s) => s.id !== id)
      saveStudents(mockStudents) // 👈 persist immediately
      return mockDelay({ success: true, id }, 500)
    }
    const { data } = await api.delete(`/students/${id}`)
    return data
  },
}

export default studentService