import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import taskService from '../../services/taskService'
import { mockCourses } from '../../mock/mockData'

const initialForm = { title: '', course: '', description: '', assignTo: 'All Students', dueDate: '' }

const statusBadgeClass = (status) => {
  if (status === 'Completed') return 'bg-teal-soft'
  if (status === 'Submitted') return 'bg-indigo-soft'
  return 'bg-amber-soft' // Pending
}

export default function TrainerTasks() {
  const [state, setState] = useState({ loading: true, error: null, tasks: [] })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [creating, setCreating] = useState(false)

  const [viewingTask, setViewingTask] = useState(null) // full task-details modal
  const [evalForm, setEvalForm] = useState({ score: '', feedback: '' })
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [submittingEval, setSubmittingEval] = useState(false)

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

  const breadcrumb = ['Trainer', 'Tasks']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading tasks..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const today = new Date().toISOString().slice(0, 10)
  const todaysTasks = state.tasks.filter((t) => t.assignedDate === today)
  const pending = state.tasks.filter((t) => t.status === 'Pending').length
  const submitted = state.tasks.filter((t) => t.status === 'Submitted').length
  const completed = state.tasks.filter((t) => t.status === 'Completed').length

  const cards = [
    { label: "Today's Tasks", value: todaysTasks.length, icon: 'bi-calendar-day', bg: 'bg-indigo-soft' },
    { label: 'Pending Tasks', value: pending, icon: 'bi-hourglass-split', bg: 'bg-amber-soft' },
    { label: 'Submitted Tasks', value: submitted, icon: 'bi-inbox', bg: 'bg-indigo-soft' },
    { label: 'Completed Tasks', value: completed, icon: 'bi-check2-circle', bg: 'bg-teal-soft' },
  ]

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Task title is required.'
    if (!form.course) next.course = 'Please select a course.'
    if (!form.dueDate) next.dueDate = 'Due date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setCreating(true)
    try {
      const newTask = await taskService.createTask({
        ...form,
        assignedDate: today,
        status: 'Pending',
        score: null,
        feedback: '',
        submission: null,
      })
      setState((s) => ({ ...s, tasks: [newTask, ...s.tasks] }))
      setShowForm(false)
      setForm(initialForm)
      setErrors({})
    } finally {
      setCreating(false)
    }
  }

  const openTaskDetails = (task) => {
    setViewingTask(task)
    setEvalForm({ score: task.score ?? '', feedback: task.feedback ?? '' })
    setShowEvalForm(false)
  }

  const closeTaskDetails = () => {
    setViewingTask(null)
    setShowEvalForm(false)
  }

  const submitEvaluation = async (e) => {
    e.preventDefault()
    setSubmittingEval(true)
    try {
      await taskService.evaluateSubmission(viewingTask.id, 'STU001', evalForm)
      const updatedTask = {
        ...viewingTask,
        status: 'Completed',
        score: Number(evalForm.score),
        feedback: evalForm.feedback,
      }
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === viewingTask.id ? updatedTask : t)),
      }))
      setViewingTask(updatedTask)
      setShowEvalForm(false)
    } finally {
      setSubmittingEval(false)
    }
  }

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="font-display fw-bold mb-0">Tasks</h4>
        <button className="btn btn-primary-stms btn-sm" onClick={() => setShowForm((f) => !f)}>
          <i className="bi bi-plus-lg me-1"></i> Create Task
        </button>
      </div>

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

      {showForm && (
        <div className="surface-card p-4 mb-4">
          <h6 className="fw-semibold mb-3">Create Task</h6>
          <form onSubmit={handleCreate}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Task Title</label>
                <input className={`form-control ${errors.title ? 'is-invalid' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Course</label>
                <select className={`form-select ${errors.course ? 'is-invalid' : ''}`} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                  <option value="">Select course</option>
                  {mockCourses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {errors.course && <div className="invalid-feedback">{errors.course}</div>}
              </div>
              <div className="col-12 mb-3">
                <label className="form-label small fw-semibold">Description</label>
                <textarea className="form-control" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Assign To</label>
                <select className="form-select" value={form.assignTo} onChange={(e) => setForm({ ...form, assignTo: e.target.value })}>
                  <option>All Students</option>
                  <option>Individual Student</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Due Date</label>
                <input type="date" className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
              </div>
            </div>
            <button className="btn btn-primary-stms" disabled={creating}>
              {creating ? <span className="spinner-border spinner-border-sm"></span> : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Today's Tasks strip — click any card to view full details */}
      {todaysTasks.length > 0 && (
        <div className="surface-card p-4 mb-4">
          <h6 className="fw-semibold mb-3">Today's Tasks</h6>
          <div className="row">
            {todaysTasks.map((t) => (
              <div className="col-md-4 mb-3" key={t.id}>
                <div
                  className="border rounded p-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openTaskDetails(t)}
                  role="button"
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="fw-semibold">{t.title}</span>
                    <span className={`badge ${statusBadgeClass(t.status)}`}>{t.status}</span>
                  </div>
                  <div className="text-muted small">{t.course}</div>
                  <div className="text-muted small">Due: {t.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface-card">
        <div className="table-responsive">
          <table className="table table-stms align-middle mb-0">
            <thead><tr><th>Task</th><th>Course</th><th>Status</th><th>Score</th><th>Actions</th></tr></thead>
            <tbody>
              {state.tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted small py-4">No tasks yet.</td>
                </tr>
              ) : (
                state.tasks.map((t) => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => openTaskDetails(t)}>
                    <td className="fw-semibold">{t.title}</td>
                    <td>{t.course}</td>
                    <td><span className={`badge ${statusBadgeClass(t.status)}`}>{t.status}</span></td>
                    <td>{t.score != null ? `${t.score}/100` : '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openTaskDetails(t)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Task Details Modal — shows what was assigned + what the student submitted */}
      {viewingTask && (
        <>
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: 14 }}>
                <div className="modal-header border-0">
                  <h5 className="modal-title font-display">Task Details</h5>
                  <button className="btn-close" onClick={closeTaskDetails}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <p className="text-muted small mb-1">Title</p>
                    <p className="fw-semibold mb-0">{viewingTask.title}</p>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <p className="text-muted small mb-1">Course</p>
                      <p className="mb-0">{viewingTask.course}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Status</p>
                      <span className={`badge ${statusBadgeClass(viewingTask.status)}`}>{viewingTask.status}</span>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <p className="text-muted small mb-1">Assigned Date</p>
                      <p className="mb-0">{viewingTask.assignedDate}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Due Date</p>
                      <p className="mb-0">{viewingTask.dueDate}</p>
                    </div>
                  </div>
                  {viewingTask.description && (
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Description / Instructions</p>
                      <p className="mb-0">{viewingTask.description}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="text-muted small mb-1">Assigned To</p>
                    <p className="mb-0">{viewingTask.assignTo}</p>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <p className="text-muted small mb-1">Student Name</p>
                    <p className="fw-semibold mb-0">Sathiya Moorthy</p>
                  </div>

                  {viewingTask.status === 'Pending' && (
                    <div className="alert alert-warning py-2 small mb-0">
                      Student hasn't submitted this task yet.
                    </div>
                  )}

                  {viewingTask.submission && (
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Submitted Work</p>
                      {viewingTask.submission.githubUrl && (
                        <p className="mb-1">
                          <i className="bi bi-github me-1"></i>
                          <a href={viewingTask.submission.githubUrl} target="_blank" rel="noreferrer">
                            {viewingTask.submission.githubUrl}
                          </a>
                        </p>
                      )}
                      {viewingTask.submission.fileName && (
                        <p className="mb-1">
                          <i className="bi bi-paperclip me-1"></i>{viewingTask.submission.fileName}
                        </p>
                      )}
                      {viewingTask.submission.submittedAt && (
                        <p className="text-muted small mb-0">
                          Submitted: {new Date(viewingTask.submission.submittedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {viewingTask.status === 'Completed' && (
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Score</p>
                      <p className="fw-semibold mb-2">{viewingTask.score}/100</p>
                      {viewingTask.feedback && (
                        <>
                          <p className="text-muted small mb-1">Feedback</p>
                          <p className="mb-0">{viewingTask.feedback}</p>
                        </>
                      )}
                    </div>
                  )}

                  {viewingTask.status === 'Submitted' && !showEvalForm && (
                    <button className="btn btn-primary-stms btn-sm" onClick={() => setShowEvalForm(true)}>
                      Evaluate Submission
                    </button>
                  )}

                  {viewingTask.status === 'Submitted' && showEvalForm && (
                    <form onSubmit={submitEvaluation} className="border-top pt-3 mt-2">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Score / 100</label>
                        <input
                          type="number" min="0" max="100" required
                          className="form-control"
                          value={evalForm.score}
                          onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Feedback</label>
                        <textarea
                          className="form-control" rows="3"
                          value={evalForm.feedback}
                          onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-light btn-sm" onClick={() => setShowEvalForm(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary-stms btn-sm" disabled={submittingEval}>
                          {submittingEval ? <span className="spinner-border spinner-border-sm"></span> : 'Submit Evaluation'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={closeTaskDetails}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}
    </Layout>
  )
}