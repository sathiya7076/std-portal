import api, { mockDelay } from './api'
import { mockNotifications } from '../mock/mockData'

const USE_MOCK = true
let notificationsStore = [...mockNotifications]

const notificationService = {
  async getAll(audience) {
    if (USE_MOCK) {
      const list = audience
        ? notificationsStore.filter((n) => !n.audience || n.audience === audience)
        : notificationsStore
      return mockDelay([...list])
    }
    const { data } = await api.get('/notifications', { params: audience ? { audience } : {} })
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

  // --- Additions below: needed so trainer actions can actually create
  // notifications. Nothing above this line was changed. ---

  // Generic creator. `audience` controls who sees it: 'student', 'trainer',
  // or omit for everyone. Call this from wherever the trainer action lives
  // (addCourse, addMaterial, assignTask, updateX, etc).
  async addNotification({ title, message, type = 'info', audience } = {}) {
    const notification = {
      id: Date.now(), // matches the numeric id style used by markAsRead
      title,
      message,
      type,        // e.g. 'course', 'material', 'task', 'update'
      audience,    // 'student' | 'trainer' | undefined (both)
      read: false,
      createdAt: new Date().toISOString(),
    }
    if (USE_MOCK) {
      notificationsStore = [notification, ...notificationsStore]
      return mockDelay(notification, 200)
    }
    const { data } = await api.post('/notifications', notification)
    return data
  },

  // Convenience wrappers — call these directly from your trainer action
  // handlers so the calling code stays readable, e.g.:
  //   await notificationService.notifyCourseAdded(course.name)
  async notifyCourseAdded(courseName) {
    return notificationService.addNotification({
      title: 'New Course Added',
      message: `Course "${courseName}" has been added.`,
      type: 'course',
      audience: 'student',
    })
  },

  async notifyMaterialAdded(courseName, materialName) {
    return notificationService.addNotification({
      title: 'New Material Uploaded',
      message: `New material "${materialName}" added to "${courseName}".`,
      type: 'material',
      audience: 'student',
    })
  },

  async notifyTaskAssigned(taskTitle, studentName) {
    return notificationService.addNotification({
      title: 'New Task Assigned',
      message: `Task "${taskTitle}" assigned to ${studentName}.`,
      type: 'task',
      audience: 'student',
    })
  },

  async notifyTrainerUpdate(itemLabel) {
    return notificationService.addNotification({
      title: 'Item Updated',
      message: `${itemLabel} was updated.`,
      type: 'update',
      audience: 'trainer',
    })
  },

  async getUnreadCount(audience) {
    const list = await notificationService.getAll(audience)
    return list.filter((n) => !n.read).length
  },
}

export default notificationService