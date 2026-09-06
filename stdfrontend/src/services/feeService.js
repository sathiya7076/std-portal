import api, { mockDelay } from './api'
import { mockFees } from '../mock/mockData'

const USE_MOCK = true
const STORAGE_KEY = 'stms_mockFees_v1'

// FIXED: previously plain in-memory state that reset to seed data on
// every page refresh — silently reverting any payment just made. Now
// persisted to localStorage, same pattern already used in studentService.js.
const loadFeesState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.warn('Failed to parse stored fees, falling back to seed data.', err)
  }
  const seed = JSON.parse(JSON.stringify(mockFees))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

const saveFeesState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to save fees to localStorage.', err)
  }
}

let mockFeesState = loadFeesState()

const feeService = {
  async getMyFees() {
    if (USE_MOCK) return mockDelay({ ...mockFeesState })
    const { data } = await api.get('/fees/mine')
    return data
  },

  // payload: { studentName, studentId, course, email, phone, paymentMethod, amount }
  async payFees(payload) {
    if (USE_MOCK) {
      const receiptId = `RCPT-${Date.now()}`
      const paymentDate = new Date().toISOString().slice(0, 10)

      mockFeesState.paidAmount += payload.amount
      mockFeesState.pendingAmount = Math.max(0, mockFeesState.pendingAmount - payload.amount)
      mockFeesState.status = mockFeesState.pendingAmount === 0 ? 'Paid' : 'Partially Paid'
      mockFeesState.history = [
        { date: paymentDate, amount: payload.amount, status: 'Paid', receiptId },
        ...mockFeesState.history,
      ]

      // ADDED: persist the updated state so a refresh doesn't lose the payment
      saveFeesState(mockFeesState)

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
}

export default feeService