import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import courseService from '../../services/courseService'

const initialForm = { name: '', description: '', technologies: '', duration: '', fees: '', roadmap: '', trainer: '', image: null }

export default function TrainerCourses() {
  const [tab, setTab] = useState('current')
  const [state, setState] = useState({ loading: true, error: null, courses: [] })
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)

  const load = async () => {
    setState({ loading: true, error: null, courses: [] })
    try {
      const courses = await courseService.getAllCourses()
      setState({ loading: false, error: null, courses })
    } catch {
      setState({ loading: false, error: 'Unable to load courses.', courses: [] })
    }
  }

  useEffect(() => { load() }, [])

  const currentCourses = state.courses.filter((c) => c.status !== 'New')
  const newCourses = state.courses.filter((c) => c.status === 'New')

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Course name is required.'
    if (!form.duration.trim()) next.duration = 'Duration is required.'
    if (!form.fees) next.fees = 'Fees is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setCreating(true)
    await courseService.createCourse({
      ...form,
      fees: Number(form.fees),
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      roadmap: form.roadmap.split(',').map((t) => t.trim()).filter(Boolean),
      status: 'Active', // 👈 shows up in Current Courses immediately
      icon: 'bi-mortarboard',
    })
    setCreating(false)
    setSuccess(true)
    setForm(initialForm)
    setTab('current') // 👈 auto-switch so the user sees it right away
    load()
    setTimeout(() => setSuccess(false), 2500)
  }

  const breadcrumb = ['Trainer', 'Courses']

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-4">Courses</h4>

      {success && (
        <div className="alert alert-success py-2 small">
          <i className="bi bi-check-circle me-2"></i>
          Course created successfully!
        </div>
      )}

      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'current' ? 'active btn-primary-stms' : 'text-secondary'}`} onClick={() => setTab('current')}>Current Courses</button>
        </li>
        <li className="nav-item ms-2">
          <button className={`nav-link ${tab === 'new' ? 'active btn-primary-stms' : 'text-secondary'}`} onClick={() => setTab('new')}>New Courses</button>
        </li>
      </ul>

      {state.loading && <Loading message="Loading courses..." />}
      {state.error && <ErrorMessage message={state.error} onRetry={load} />}

      {!state.loading && !state.error && tab === 'current' && (
        <div className="surface-card">
          <div className="table-responsive">
            <table className="table table-stms align-middle mb-0">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Students</th>
                  <th>Duration</th>
                  <th>Fees</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted small py-4">No courses yet.</td>
                  </tr>
                ) : (
                  currentCourses.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-semibold">{c.name}</td>
                      <td>{c.students ?? 0}</td>
                      <td>{c.duration}</td>
                      <td>₹{Number(c.fees || 0).toLocaleString('en-IN')}</td>
                      <td><span className="badge bg-teal-soft">{c.status}</span></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!state.loading && !state.error && tab === 'new' && (
        <div className="row">
          <div className="col-lg-7 mb-4">
            {newCourses.length > 0 && (
              <div className="surface-card p-4 mb-4">
                <h6 className="fw-semibold mb-3">Recently Added</h6>
                {newCourses.map((c) => (
                  <div key={c.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <span>{c.name}</span>
                    <span className="badge bg-amber-soft">{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="col-lg-5 mb-4">
            <div className="surface-card p-4">
              <h6 className="fw-semibold mb-3">Create New Course</h6>
              <form onSubmit={handleCreate}>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Course Name</label>
                  <input className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea className="form-control form-control-sm" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Technologies (comma separated)</label>
                  <input className="form-control form-control-sm" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-6 mb-2">
                    <label className="form-label small fw-semibold">Duration</label>
                    <input className={`form-control form-control-sm ${errors.duration ? 'is-invalid' : ''}`} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="form-label small fw-semibold">Fees</label>
                    <input type="number" className={`form-control form-control-sm ${errors.fees ? 'is-invalid' : ''}`} value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Roadmap (comma separated)</label>
                  <input className="form-control form-control-sm" value={form.roadmap} onChange={(e) => setForm({ ...form, roadmap: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Trainer</label>
                  <input className="form-control form-control-sm" value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Course Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                  />
                  {form.image && <div className="form-text">{form.image.name} ({Math.round(form.image.size / 1024)} KB)</div>}
                </div>
                <button className="btn btn-primary-stms btn-sm w-100" disabled={creating}>
                  {creating ? <span className="spinner-border spinner-border-sm"></span> : 'Create'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}