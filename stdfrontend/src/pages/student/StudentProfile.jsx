import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import ProgressBar from '../../components/ProgressBar'
import studentService from '../../services/studentService'

export default function StudentProfile() {
  const [state, setState] = useState({ loading: true, error: null, profile: null, progress: [] })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setState({ loading: true, error: null, profile: null, progress: [] })
    try {
      const profile = await studentService.getProfile()
      // FIXED: getLearningProgress() hits an unconfirmed backend route —
      // isolated into its own try/catch so a missing/broken progress
      // endpoint doesn't block the whole profile from loading.
      let progress = []
      try {
        progress = await studentService.getLearningProgress()
      } catch (err) {
        console.warn('Learning progress unavailable:', err?.response?.data || err.message)
      }
      setState({ loading: false, error: null, profile, progress })
      setForm(profile)
    } catch (err) {
      console.error('Failed to load profile:', err?.response?.data || err.message)
      setState({ loading: false, error: 'Unable to load your profile.', profile: null, progress: [] })
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // FIXED: backend updateMyProfile only accepts phone + address —
      // sending the whole form (including course, name, email which the
      // backend ignores/can't change) is harmless but only these two
      // actually persist.
      const updated = await studentService.updateProfile({
        phone: form.phone,
        address: form.address,
      })
      setState((s) => ({ ...s, profile: { ...s.profile, ...updated } }))
    } catch (err) {
      console.error('Failed to update profile:', err?.response?.data || err.message)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const breadcrumb = ['Student', 'Student Profile']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading your profile..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const p = state.profile

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="font-display fw-bold mb-0">Student Profile</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing((e) => !e)}>
          <i className="bi bi-pencil me-1"></i>{editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3">Personal Details</h6>
            {!editing ? (
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="text-muted">Name</td><td className="fw-semibold">{p.name}</td></tr>
                  {/* FIXED: was p.id — backend field is studentId */}
                  <tr><td className="text-muted">Student ID</td><td className="fw-semibold">{p.studentId}</td></tr>
                  {/* FIXED: p.course is now an object ({name, duration, fees, trainerId}), not a string */}
                  <tr><td className="text-muted">Course</td><td className="fw-semibold">{p.course?.name || '—'}</td></tr>
                  {/* NEW: assigned trainer, now available via the nested populate fix */}
                  <tr>
                    <td className="text-muted">Trainer</td>
                    <td className="fw-semibold">
                      {p.course?.trainerId?.userId?.name || 'Not assigned'}
                    </td>
                  </tr>
                  <tr><td className="text-muted">Email</td><td className="fw-semibold">{p.email}</td></tr>
                  <tr><td className="text-muted">Phone</td><td className="fw-semibold">{p.phone}</td></tr>
                  <tr><td className="text-muted">Address</td><td className="fw-semibold">{p.address}</td></tr>
                </tbody>
              </table>
            ) : (
              <form onSubmit={handleSave}>
                {['phone', 'address'].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label small fw-semibold text-capitalize">{field}</label>
                    <input
                      className="form-control"
                      value={form[field] || ''}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    />
                  </div>
                ))}
                <button className="btn btn-primary-stms" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm"></span> : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3">Learning Progress</h6>
            {state.progress.length === 0 ? (
              <p className="text-muted small">No progress data available yet.</p>
            ) : (
              state.progress.map((s) => (
                <ProgressBar key={s.skill} label={s.skill} percent={s.percent} />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}