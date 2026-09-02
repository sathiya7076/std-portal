import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import TaskCard from '../../components/TaskCard'
import taskService from '../../services/taskService'

export default function StudentTasks() {
  const [state, setState] = useState({ loading: true, error: null, tasks: [] })
  const [filter, setFilter] = useState('All')

  const load = async () => {
    setState({ loading: true, error: null, tasks: [] })
    try {
      const tasks = await taskService.getStudentTasks()
      setState({ loading: false, error: null, tasks })
    } catch {
      setState({ loading: false, error: 'Unable to load tasks.', tasks: [] })
    }
  }

  useEffect(() => { load() }, [])

  const breadcrumb = ['Student', 'Tasks']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading tasks..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const today = new Date().toISOString().slice(0, 10)
  const todaysTasks = state.tasks.filter((t) => t.assignedDate === today || t.dueDate === today).length
  const pending = state.tasks.filter((t) => t.status === 'Pending').length
  const completed = state.tasks.filter((t) => t.status === 'Completed').length
  const avgScore = (() => {
    const scored = state.tasks.filter((t) => t.score != null)
    if (!scored.length) return '—'
    return Math.round(scored.reduce((s, t) => s + t.score, 0) / scored.length)
  })()

  const cards = [
    { label: "Today's Tasks", value: todaysTasks, icon: 'bi-calendar-day', bg: 'bg-indigo-soft' },
    { label: 'Pending Tasks', value: pending, icon: 'bi-hourglass-split', bg: 'bg-amber-soft' },
    { label: 'Completed Tasks', value: completed, icon: 'bi-check2-circle', bg: 'bg-teal-soft' },
    { label: 'My Score', value: avgScore === '—' ? avgScore : `${avgScore}/100`, icon: 'bi-award', bg: 'bg-indigo-soft' },
  ]

  const filtered = filter === 'All' ? state.tasks : state.tasks.filter((t) => t.status === filter)

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-4">Tasks</h4>

      <div className="row mb-2">
        {cards.map((c) => (
          <div className="col-sm-6 col-lg-3" key={c.label}>
            <div className="stat-card mb-4">
              <span className={`stat-icon ${c.bg}`}><i className={`bi ${c.icon}`}></i></span>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="btn-group mb-4">
        {['All', 'Pending', 'Submitted', 'Completed'].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary-stms' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-clipboard-check" title="No tasks here" message="Nothing matches this filter right now." />
      ) : (
        <div className="row">{filtered.map((t) => <TaskCard key={t.id} task={t} />)}</div>
      )}
    </Layout>
  )
}
