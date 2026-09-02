import api, { mockDelay } from './api'
import { mockTasks as seedTasks } from '../mock/mockData'

const USE_MOCK = true
const STORAGE_KEY = 'stms_mockTasks_v1'

// ---- Persistent mock task store (backed by localStorage) ----
const loadTasks = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (err) {
    console.warn('Failed to parse stored tasks, falling back to seed data.', err)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTasks))
  return [...seedTasks]
}

const saveTasks = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Failed to save tasks to localStorage.', err)
  }
}

let tasksStore = loadTasks()
// ------------------------------------------------------------------

const taskService = {
  async getStudentTasks() {
    if (USE_MOCK) return mockDelay([...tasksStore])
    const { data } = await api.get('/tasks/mine')
    return data
  },

  async getTaskById(id) {
    if (USE_MOCK) return mockDelay(tasksStore.find((t) => t.id === id) || null)
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },

  async submitTask(id, { githubUrl, fileName }) {
    if (USE_MOCK) {
      tasksStore = tasksStore.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'Submitted',
              submission: { githubUrl, fileName, submittedAt: new Date().toISOString() },
            }
          : t
      )
      saveTasks(tasksStore)
      return mockDelay(tasksStore.find((t) => t.id === id), 800)
    }
    const { data } = await api.post(`/tasks/${id}/submit`, { githubUrl, fileName })
    return data
  },

  async createTask(payload) {
    if (USE_MOCK) {
      const newTask = { ...payload, id: payload.id || `t${Date.now()}` }
      tasksStore = [newTask, ...tasksStore]
      saveTasks(tasksStore) // 👈 persist immediately
      return mockDelay(newTask, 700)
    }
    const { data } = await api.post('/tasks', payload)
    return data
  },

  async evaluateSubmission(taskId, studentId, { score, feedback }) {
    if (USE_MOCK) {
      tasksStore = tasksStore.map((t) =>
        t.id === taskId
          ? { ...t, status: 'Completed', score: Number(score), feedback }
          : t
      )
      saveTasks(tasksStore) // 👈 persist immediately
      return mockDelay(tasksStore.find((t) => t.id === taskId), 700)
    }
    const { data } = await api.post(`/tasks/${taskId}/evaluate/${studentId}`, { score, feedback })
    return data
  },
}

export default taskService