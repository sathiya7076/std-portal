import api, { mockDelay } from './api'
import { mockFees } from '../mock/mockData'

const USE_MOCK = true

// In-memory mock store so a payment made during the session actually
// updates totals/history on the next getMyFees() call.
let mockFeesState = JSON.parse(JSON.stringify(mockFees))

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