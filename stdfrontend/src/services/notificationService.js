import api, { mockDelay } from './api'
import { mockNotifications } from '../mock/mockData'

const USE_MOCK = true

// ADDED: persist the mock notification store in localStorage so it's
// shared across tabs/windows and survives page reloads, instead of
// living only in this one tab's memory.
const STORAGE_KEY = 'stms_mock_notifications'

const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : [...mockNotifications]
  } catch {
    return [...mockNotifications]
  }
}

const saveStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (err) {
    console.error('Failed to persist mock notifications:', err)
  }
}

let notificationsStore = loadStore() // CHANGED: was `[...mockNotifications]`

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

  async markAsRead(id, audience) {
    if (USE_MOCK) {
      notificationsStore = notificationsStore.map((n) => (n.id === id ? { ...n, read: true } : n))
      saveStore(notificationsStore) // ADDED
      const list = audience
        ? notificationsStore.filter((n) => !n.audience || n.audience === audience)
        : notificationsStore
      return mockDelay([...list], 300)
    }
    const { data } = await api.put(`/notifications/${id}/read`)
    return data
  },

  async markAllAsRead(audience) {
    if (USE_MOCK) {
      notificationsStore = notificationsStore.map((n) =>
        !audience || !n.audience || n.audience === audience ? { ...n, read: true } : n
      )
      saveStore(notificationsStore) // ADDED
      const list = audience
        ? notificationsStore.filter((n) => !n.audience || n.audience === audience)
        : notificationsStore
      return mockDelay([...list], 400)
    }
    const { data } = await api.put('/notifications/read-all')
    return data
  },

  // --- Additions below: needed so trainer actions can actually create
  // notifications. Nothing above this line was changed except audience-aware
  // filtering in markAsRead / markAllAsRead. ---

  // Generic creator. `audience` controls who sees it: 'student', 'trainer',
  // or omit for everyone. Call this from wherever the trainer action lives
  // (addCourse, addMaterial, assignTask, updateX, etc).
  async addNotification({ title, message, type = 'info', audience } = {}) {
    // ADDED: map type -> icon so NotificationItem (which reads notification.icon)
    // renders correctly for notifications created through this function.
    const iconByType = {
      course: 'bi-mortarboard',
      material: 'bi-file-earmark-text',
      task: 'bi-list-task',
      update: 'bi-arrow-repeat',
      info: 'bi-bell',
    }

    const createdAt = new Date().toISOString()

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, // collision-safe even in tight loops
      title,
      message,
      type,        // e.g. 'course', 'material', 'task', 'update'
      audience,    // 'student' | 'trainer' | undefined (both)
      read: false,
      createdAt,
      icon: iconByType[type] || iconByType.info, // ADDED: NotificationItem needs this to render the icon
      date: new Date(createdAt).toLocaleString(), // ADDED: NotificationItem needs this to display a date
    }
    if (USE_MOCK) {
      notificationsStore = [notification, ...notificationsStore]
      saveStore(notificationsStore) // ADDED
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