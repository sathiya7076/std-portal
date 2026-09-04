import React, { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import studentService from '../../services/studentService'
import authService from '../../services/authService'
import { mockCourses } from '../../mock/mockData'

const initialForm = {
  name: '', email: '', phone: '', course: '', id: '', password: '', joiningDate: '',
}

export default function AddStudent() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [listError, setListError] = useState('')

  const loadStudents = async () => {
    setLoadingStudents(true)
    setListError('')
    try {
      const data = await studentService.getAllStudents()
      setStudents(Array.isArray(data) ? data : (data?.students ?? []))
    } catch (err) {
      setListError(err?.response?.data?.message || 'Failed to load students list.')
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Student name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    if (!form.course) next.course = 'Please select a course.'
    if (!form.password || form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (!form.joiningDate) next.joiningDate = 'Joining date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      // Step 1: register the account. CONFIRMED (authController.js):
      // this ALSO auto-creates the linked Student profile — the backend
      // generates its own studentId (e.g. "STU-LX7K9F"); it does not
      // accept a custom one at this step.
      const { profile } = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'student',
        phone: form.phone,
      })

      if (!profile?._id) {
        throw new Error('Registration succeeded, but no profile ID was returned to complete setup.')
      }

      // Step 2: fill in the fields register didn't collect, using the
      // Student document's real Mongo _id (profile._id) — CONFIRMED
      // correct target for PUT /students/:id.
      //
      // ⚠️ KNOWN UNRESOLVED GAP — course mapping:
      // The backend's Student model expects `courseId` to be a real
      // Course document's Mongo ID (see Student.create in
      // authController.js). The dropdown below is currently populated
      // from `mockCourses` (local mock data), so `form.course` is a
      // course NAME string, not a real backend Course _id. Sending it
      // as courseId will likely fail silently or store an invalid
      // reference. This needs a real courses list from the backend
      // (e.g. GET /courses) with actual _id values used as the <option>
      // value, replacing mockCourses. Flagging rather than guessing —
      // share courseController.js or the Course model if you'd like
      // this wired up correctly.
      //
      // ⚠️ ALSO UNCONFIRMED: joiningDate does not appear in
      // Student.create() in authController.js, so it may not exist on
      // the Student schema. Sending it is harmless if the backend
      // ignores unknown fields, but it won't persist unless the schema
      // supports it — share models/Student.js to confirm.
      await studentService.updateStudent(profile._id, {
        courseId: form.course, // NOT YET CORRECT — see note above
        joiningDate: form.joiningDate, // UNCONFIRMED FIELD — see note above
        phone: form.phone,
      })

      setSubmitting(false)
      setSuccess(true)
      setForm(initialForm)
      setErrors({})
      await loadStudents()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setSubmitting(false)
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        err?.message

      if (err?.response?.status === 409) {
        setServerError(backendMsg || 'A user with this email already exists.')
      } else {
        setServerError(backendMsg || 'Failed to add student. Please try again.')
      }
    }
  }

  return (
    <Layout breadcrumb={['Trainer', 'Students', 'Add Student']}>
      <h4 className="font-display fw-bold mb-4">Add Student</h4>

      {success && (
        <div className="alert alert-success py-2 small">
          <i className="bi bi-check-circle me-2"></i>
          Student created successfully! They can log in with Email: <strong>{form.email}</strong> and the password you set.
        </div>
      )}
      {serverError && (
        <div className="alert alert-danger py-2 small">{serverError}</div>
      )}

      <div className="surface-card p-4 mb-4" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Student Name</label>
              <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={handleChange('name')} />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Email (used for login)</label>
              <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={handleChange('email')} />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Phone</label>
              <input className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={handleChange('phone')} />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Course</label>
              {/* ⚠️ Still using mockCourses (names, not real backend IDs) — see note in handleSubmit above */}
              <select className={`form-select ${errors.course ? 'is-invalid' : ''}`} value={form.course} onChange={handleChange('course')}>
                <option value="">Select a course</option>
                {mockCourses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.course && <div className="invalid-feedback">{errors.course}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Joining Date</label>
              <input type="date" className={`form-control ${errors.joiningDate ? 'is-invalid' : ''}`} value={form.joiningDate} onChange={handleChange('joiningDate')} />
              {errors.joiningDate && <div className="invalid-feedback">{errors.joiningDate}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Password</label>
              <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={handleChange('password')} />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>
          <button className="btn btn-primary-stms" disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : 'Create Student'}
          </button>
        </form>
      </div>

      <div className="surface-card p-4">
        <h6 className="fw-bold mb-3">Registered Students</h6>

        {listError && <div className="alert alert-danger py-2 small">{listError}</div>}

        {loadingStudents ? (
          <div className="text-muted small">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="text-muted small">No students registered yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Joining Date</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.studentId}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>{s.course}</td>
                    <td>{s.joiningDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}