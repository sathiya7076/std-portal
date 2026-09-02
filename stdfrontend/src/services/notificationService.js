import api, { mockDelay } from './api'
import { mockNotifications } from '../mock/mockData'

const USE_MOCK = true
let notificationsStore = [...mockNotifications]

const notificationService = {
  async getAll() {
    if (USE_MOCK) return mockDelay([...notificationsStore])
    const { data } = await api.get('/notifications')
    return data
  },

  async markAsRead(id) {
    if (USE_MOCK) {
      notificationsStore = notificationsStore.map((n) => (n.id === id ? { ...n, read: true } : n))
      return mockDelay([...notificationsStore], 300)
    }
    const { data } = await api.put(`/notifications/${id}/read`)
    return data
  },

  async markAllAsRead() {
    if (USE_MOCK) {
      notificationsStore = notificationsStore.map((n) => ({ ...n, read: true }))
      return mockDelay([...notificationsStore], 400)
    }
    const { data } = await api.put('/notifications/read-all')
    return data
  },
}

export default notificationService
