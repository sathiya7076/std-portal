import api, { mockDelay } from './api'
import { mockFees } from '../mock/mockData'

const USE_MOCK = true

const feeService = {
  async getMyFees() {
    if (USE_MOCK) return mockDelay({ ...mockFees })
    const { data } = await api.get('/fees/mine')
    return data
  },

  async downloadReceipt(receiptId) {
    if (USE_MOCK) return mockDelay({ success: true, receiptId }, 400)
    const { data } = await api.get(`/fees/receipt/${receiptId}`, { responseType: 'blob' })
    return data
  },
}

export default feeService
