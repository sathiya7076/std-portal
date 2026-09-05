import api, { mockDelay } from './api'
import {
  mockUsers,
  mockAttendance,
  mockLearningProgress,
  mockStudents as seedStudents,
} from '../mock/mockData'

const USE_MOCK = false
const STORAGE_KEY = 'stms_mockStudents_v1'

const loadStudents = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.warn('Failed to parse stored students, falling back to seed data.', err)
  }
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

let mockStudents = USE_MOCK ? loadStudents() : []

const extractData = (payload) => (payload?.data !== undefined ? payload.data : payload)

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.students)) return payload.students
  if (Array.isArray(payload?.data?.students)) return payload.data.students
  console.warn('Unexpected students response shape:', payload)
  return []
}

// UPDATED based on confirmed backend shape (authController.js's register
// function, and getMe's use of .populate("courseId", "name duration fees")):
//
// - _id: the REAL Mongo ID. Use this for every API call (getStudentById,
//   updateStudent, deleteStudent, navigation). NEVER use studentId for
//   these — it's not a valid ObjectId and will break findById-style
//   backend lookups.
// - studentId: the backend-auto-generated human-readable code
//   (e.g. "STU-LX7K9F"). DISPLAY ONLY.
// - course: if the backend populates courseId (as getMe does), it comes
//   back as an object like { _id, name, duration, fees } — this reads
//   raw.courseId?.name in that case. If GET /students does NOT populate
//   it, course will show blank until that's confirmed.
//
// CONFIRMED via models/Student.js: the Student document itself has NO
// `name` or `email` field — only userId (ref User), studentId, courseId,
// phone, address, joiningDate, learningProgress. Name/email live on the
// linked User document. So GET /students must `.populate('userId', 'name
// email')` (the same pattern getMe() already uses for courseId) for
// these to ever show up here. This normalizer now reads them off a
// populated raw.userId object if present — but if the backend sends
// userId as a plain ObjectId string (not populated), there is nothing
// on the client to recover: check the [DEBUG] console log below (or the
// network tab) to see whether raw.userId is a string or an object, and
// if it's a string, the fix belongs in the GET /students controller,
// not here.
const normalizeStudent = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  const user = typeof raw.userId === 'object' ? raw.userId : null
  return {
    ...raw,
    _id: raw._id ?? raw.id,
    studentId: raw.studentId ?? raw.id ?? raw._id,
    name: raw.name ?? raw.fullName ?? raw.studentName ?? raw.full_name ?? user?.name,
    course:
      (typeof raw.courseId === 'object' ? raw.courseId?.name : raw.course) ??
      raw.courseName ??
      raw.course_name,
    attendance: raw.attendance ?? raw.attendancePercentage ?? raw.attendancePercent ?? 0,
    progress: raw.progress ?? raw.learningProgress ?? raw.progressPercentage ?? 0,
    email: raw.email ?? raw.userEmail ?? user?.email,
    phone: raw.phone ?? raw.phoneNumber ?? raw.mobile,
    joiningDate: raw.joiningDate ?? raw.joinDate ?? raw.createdAt,
  }
}

const studentService = {
  async getProfile() {
    if (USE_MOCK) return mockDelay({ ...mockUsers.student })
    const { data } = await api.get('/student/profile')
    return normalizeStudent(extractData(data))
  },

  async updateProfile(payload) {
    // Student's own self-service update — acts on whichever account's
    // token is active. Never call this from trainer screens.
    if (USE_MOCK) return mockDelay({ ...mockUsers.student, ...payload })
    const { data } = await api.put('/student/profile', payload)
    return normalizeStudent(extractData(data))
  },

  // CONFIRMED route: PUT /students/:id (trainer-only, per studentRoutes.js).
  // id MUST be the Student document's Mongo _id (see normalizeStudent).
  async updateStudent(mongoId, payload) {
    if (USE_MOCK) {
      mockStudents = mockStudents.map((s) => (s._id === mongoId ? { ...s, ...payload } : s))
      saveStudents(mockStudents)
      return mockDelay({ ...payload, _id: mongoId })
    }
    const { data } = await api.put(`/students/${mongoId}`, payload)
    return normalizeStudent(extractData(data))
  },

  async getAttendance() {
    if (USE_MOCK) return mockDelay({ ...mockAttendance })
    const { data } = await api.get('/students/me/attendance')
    return extractData(data)
  },

  async getLearningProgress() {
    if (USE_MOCK) return mockDelay([...mockLearningProgress])
    const { data } = await api.get('/students/me/progress')
    return extractData(data)
  },

  async registerFingerprint() {
    if (USE_MOCK) return mockDelay({ success: true }, 1800)
    const { data } = await api.post('/students/me/fingerprint')
    return extractData(data)
  },

  async getAllStudents({ search = '', course = '', sortBy = 'name' } = {}) {
    if (USE_MOCK) {
      let list = [...mockStudents]
      if (search) {
        const q = search.toLowerCase()
        list = list.filter(
          (s) => s.name.toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q)
        )
      }
      if (course) list = list.filter((s) => s.course === course)
      list.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1))
      return mockDelay(list)
    }
    const { data } = await api.get('/students', { params: { search, course, sortBy } })
    const rawList = extractArray(data)

    if (rawList.length > 0) {
      // FIX: this debug line already existed — keep using it to check
      // whether raw.userId comes back as a string (needs backend
      // populate) or an object with name/email (frontend fix applies).
      console.log('[DEBUG] Raw student object from backend:', rawList[0])
      console.log('[DEBUG] raw.userId shape:', rawList[0]?.userId)
    }

    return rawList.map(normalizeStudent)
  },

  // id here is the Mongo _id (see normalizeStudent / TrainerStudents.jsx).
  async getStudentById(mongoId) {
    if (USE_MOCK) {
      const student = mockStudents.find((s) => s._id === mongoId)
      return mockDelay(student ? { ...student, ...mockAttendance } : null)
    }
    const { data } = await api.get(`/students/${mongoId}`)
    return normalizeStudent(extractData(data))
  },

  // NOTE: with the register-auto-creates-profile flow now confirmed,
  // this create call is no longer used by AddStudent.jsx (it would
  // 409 — the profile already exists). Left in place in case you have
  // another flow that needs a direct create without registration.
  async createStudent(payload) {
    if (USE_MOCK) {
      const newStudent = { ...payload, studentId: payload.studentId || `STU-${Math.floor(Math.random() * 900 + 100)}` }
      mockStudents.push(newStudent)
      saveStudents(mockStudents)
      return mockDelay(newStudent, 700)
    }
    const { data } = await api.post('/students', payload)
    return normalizeStudent(extractData(data))
  },

  async deleteStudent(mongoId) {
    if (USE_MOCK) {
      mockStudents = mockStudents.filter((s) => s._id !== mongoId)
      saveStudents(mockStudents)
      return mockDelay({ success: true, id: mongoId })
    }
    const { data } = await api.delete(`/students/${mongoId}`)
    return extractData(data)
  },
}

export default studentService