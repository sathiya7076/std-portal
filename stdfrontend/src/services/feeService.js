import api, { mockDelay } from './api'
import { mockFees } from '../mock/mockData'

const USE_MOCK = true
const STORAGE_KEY = 'stms_mockFees_v1'

// Default per-course total fees, used only until someone sets a real
// amount via setCourseFee() below. Adjust these placeholders or just
// call setCourseFee() from your UI once for each course.
const COURSE_FEES = {
  'Full Stack Development': 45000,
  'Data Science': 55000,
  'UI/UX Design': 35000,
  'Digital Marketing': 25000,
}
const DEFAULT_COURSE_FEE = 30000 // fallback if course isn't in COURSE_FEES and no override was set

// ADDED: lets you enter/override a course's fee amount at runtime
// (e.g. from a trainer/admin screen) instead of only using the fixed
// COURSE_FEES table above. Overrides persist in localStorage so they
// survive a page refresh.
const COURSE_FEE_OVERRIDES_KEY = 'stms_courseFeeOverrides_v1'

const getCourseFeeOverrides = () => {
  try {
    const saved = localStorage.getItem(COURSE_FEE_OVERRIDES_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch (err) {
    console.warn('Failed to parse course fee overrides.', err)
    return {}
  }
}

const saveCourseFeeOverrides = (overrides) => {
  try {
    localStorage.setItem(COURSE_FEE_OVERRIDES_KEY, JSON.stringify(overrides))
  } catch (err) {
    console.error('Failed to save course fee overrides.', err)
  }
}

// Resolution order: manually entered override > COURSE_FEES table > default.
const resolveCourseFee = (course) => {
  const overrides = getCourseFeeOverrides()
  if (course && overrides[course] != null) return Number(overrides[course])
  return COURSE_FEES[course] ?? DEFAULT_COURSE_FEE
}

// per-student storage key, so each student gets their own fee record
// instead of everyone sharing one global mockFeesState object.
const getStorageKey = (studentId) =>
  studentId ? `${STORAGE_KEY}_${studentId}` : STORAGE_KEY // no studentId = legacy shared key

// FIXED: previously plain in-memory state that reset to seed data on
// every page refresh — silently reverting any payment just made. Now
// persisted to localStorage, same pattern already used in studentService.js.
const loadFeesState = (studentId, course) => {
  const key = getStorageKey(studentId)
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.warn('Failed to parse stored fees, falling back to seed data.', err)
  }

  let seed
  if (studentId) {
    const totalFees = resolveCourseFee(course)
    seed = {
      studentName: '',
      studentId,
      course: course || '',
      email: '',
      phone: '',
      totalFees,
      paidAmount: 0,
      pendingAmount: totalFees,
      status: 'Pending',
      history: [],
    }
  } else {
    // legacy path — no studentId passed, behaves exactly as before
    seed = JSON.parse(JSON.stringify(mockFees))
  }

  localStorage.setItem(key, JSON.stringify(seed))
  return seed
}

const saveFeesState = (state, studentId) => {
  try {
    localStorage.setItem(getStorageKey(studentId), JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save fees to localStorage.', err)
  }
}

// Legacy global state (kept for backward compatibility with any
// existing no-argument callers).
let mockFeesState = loadFeesState()

const feeService = {
  // Pass { studentId, course } so each student's fees reflect their own
  // course. Calling getMyFees() with no args still works exactly as
  // before (shared/legacy record).
  async getMyFees({ studentId, course } = {}) {
    if (USE_MOCK) {
      if (studentId) {
        const state = loadFeesState(studentId, course)
        return mockDelay({ ...state })
      }
      return mockDelay({ ...mockFeesState })
    }
    const { data } = await api.get('/fees/mine', { params: { studentId, course } })
    return data
  },

  // payload: { studentId, studentName, course, email, phone, paymentMethod, amount }
  async payFees(payload) {
    if (USE_MOCK) {
      const receiptId = `RCPT-${Date.now()}`
      const paymentDate = new Date().toISOString().slice(0, 10)

      const targetState = payload.studentId
        ? loadFeesState(payload.studentId, payload.course)
        : mockFeesState

      targetState.paidAmount += payload.amount
      targetState.pendingAmount = Math.max(0, targetState.pendingAmount - payload.amount)
      targetState.status = targetState.pendingAmount === 0 ? 'Paid' : 'Partially Paid'
      targetState.history = [
        { date: paymentDate, amount: payload.amount, status: 'Paid', receiptId },
        ...targetState.history,
      ]

      if (!payload.studentId) {
        mockFeesState = targetState // keep legacy reference in sync
      }

      saveFeesState(targetState, payload.studentId)

      return mockDelay({ success: true, receiptId, amount: payload.amount, date: paymentDate }, 700)
    }
    const { data } = await api.post('/fees/pay', payload)
    return data
  },

  async downloadReceipt(receiptId) {
    if (USE_MOCK) return mockDelay({ success: true, receiptId }, 400)
    const { data } = await api.get(`/fees/receipt/${receiptId}`, { responseType: 'blob' })
    return data
  },

  // ADDED: enter/update the total fee amount for a course. Call this
  // from a trainer/admin UI, e.g.:
  //   feeService.setCourseFee('Data Science', 60000)
  // Any student on that course whose fee record hasn't been created yet
  // will be seeded with this amount. Existing per-student records already
  // created keep their original totalFees (this only affects new ones) —
  // pass updateExisting: true as a second step if you also want it to
  // retroactively adjust totalFees/pendingAmount for a specific student.
  async setCourseFee(course, amount) {
    const overrides = getCourseFeeOverrides()
    overrides[course] = Number(amount)
    saveCourseFeeOverrides(overrides)
    return mockDelay({ success: true, course, amount: Number(amount) }, 300)
  },

  // ADDED: read back the current fee configured for a course (override
  // if set, otherwise the default table value) — useful to prefill a
  // "set course fee" form with the current amount.
  async getCourseFee(course) {
    return mockDelay({ course, amount: resolveCourseFee(course) }, 150)
  },
}

export default feeService