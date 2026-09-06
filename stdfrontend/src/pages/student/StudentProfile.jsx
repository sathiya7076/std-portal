import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import ProgressBar from '../../components/ProgressBar'
import studentService from '../../services/studentService'

export default function StudentProfile() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    profile: null,
    progress: [],
    // Distinguishes "no progress data" from "progress endpoint failed /
    // returned an unexpected shape" so the UI never shows a misleading
    // "No progress data available yet." for a real failure.
    progressError: null,
  })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const load = async () => {
    setState({ loading: true, error: null, profile: null, progress: [], progressError: null })
    try {
      const profile = await studentService.getProfile()

      // Isolated in its own try/catch so a missing/broken progress
      // endpoint doesn't block the whole profile from loading.
      let progress = []
      let progressError = null
      try {
        const result = await studentService.getLearningProgress()

        // FIXED: the request can resolve successfully (no throw) while
        // returning a non-array shape (e.g. { skills: [...] } or a single
        // object). That previously reached state.progress.map() unchecked
        // and crashed with "state.progress.map is not a function" — no
        // error was ever caught because the request itself didn't fail.
        // Validate the actual shape here instead of assuming success == array.
        if (Array.isArray(result)) {
          progress = result
        } else if (Array.isArray(result?.skills)) {
          // Common alt shape — backend wraps the array in a `skills` key.
          progress = result.skills
        } else if (Array.isArray(result?.progress)) {
          // Common alt shape — backend wraps the array in a `progress` key.
          progress = result.progress
        } else if (result && typeof result === 'object') {
          // DEBUG: log the actual shape so the real backend response
          // structure is visible in console instead of guessing further.
          console.warn('[DEBUG] getLearningProgress returned non-array:', result)
          progress = []
          progressError = 'Progress data is in an unexpected format.'
        } else {
          progress = []
        }
      } catch (err) {
        console.warn('Learning progress unavailable:', err?.response?.data || err.message)
        progressError = 'Unable to load progress right now.'
      }

      setState({ loading: false, error: null, profile, progress, progressError })
      setForm(profile)
    } catch (err) {
      console.error('Failed to load profile:', err?.response?.data || err.message)
      setState({ loading: false, error: 'Unable to load your profile.', profile: null, progress: [], progressError: null })
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      // Backend updateMyProfile only accepts phone + address — sending the
      // whole form (including course, name, email which the backend
      // ignores/can't change) is harmless but only these two persist.
      const updated = await studentService.updateProfile({
        phone: form.phone,
        address: form.address,
      })

      // FIXED: the old `{ ...s.profile, ...updated }` merge overwrote good
      // nested data (course object, trainer info, etc.) with `undefined`
      // whenever `updated` came back from a shallower populate than the
      // original getProfile() response — object spread still copies keys
      // whose value is undefined, silently wiping course/trainer from the
      // screen after every save. Merge in only the fields we actually sent
      // and that the backend is confirmed to update.
      setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          phone: updated?.phone ?? form.phone,
          address: updated?.address ?? form.address,
        },
      }))
      setEditing(false) // only close the form on confirmed success
    } catch (err) {
      console.error('Failed to update profile:', err?.response?.data || err.message)
      // FIXED: previously the form silently closed on failure with no
      // indication anything went wrong. Now we keep the form open and
      // show an error so the user knows to retry.
      setSaveError('Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
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
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => {
            setEditing((e) => !e)
            setSaveError(null) // clear stale error when toggling edit mode
          }}
        >
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
                  {/* Assigned trainer, available via the nested populate.
                      DEBUG NOTE: this 4-level chain (course -> trainerId -> userId -> name)
                      degrades silently to "Not assigned" if the backend's populate on
                      courseId doesn't also nest trainerId.userId. If a trainer really is
                      assigned but this still shows "Not assigned", the fix belongs in the
                      backend's populate chain for GET /student/profile, not here. */}
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
                {saveError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 small">{saveError}</div>
                )}
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
            {state.progressError ? (
              <p className="text-danger small mb-0">{state.progressError}</p>
            ) : !Array.isArray(state.progress) || state.progress.length === 0 ? (
              // FIXED: guards state.progress.map even if a bad shape ever
              // slips past the checks in load() — this line alone is what
              // was crashing before ("state.progress.map is not a function").
              <p className="text-muted small">No progress data available yet.</p>
            ) : (
              state.progress.map((s, i) => (
                // key falls back to index-based composite since `skill`
                // alone isn't guaranteed unique across entries.
                <ProgressBar key={s.id ?? `${s.skill}-${i}`} label={s.skill} percent={s.percent} />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}