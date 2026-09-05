import React, { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import studentService from '../../services/studentService'
import authService from '../../services/authService'
import api from '../../services/api'

const initialForm = {
  name: '', email: '', phone: '', address: '', course: '', password: '', joiningDate: '',
}

export default function AddStudent() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  // FIX: form gets reset to initialForm right after a successful submit
  // (see handleSubmit), which happens in the same batched update as
  // setSuccess(true) — so the success alert can no longer read the
  // submitted values off `form`. Capture the registered student's data
  // separately so it survives the reset and can be displayed in full
  // (studentId, name, email, phone, course, joining date) instead of
  // just the email.
  const [registeredProfile, setRegisteredProfile] = useState(null)
  const [serverError, setServerError] = useState('')
  const successTimeoutRef = useRef(null)

  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [listError, setListError] = useState('')

  // FIX: courses now come from the backend instead of mockCourses.
  // The Student model expects courseId to be a real Course _id
  // (per authController.js's Student.create) — mockCourses only had
  // names, so submissions were silently sending an invalid reference.
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseLoadError, setCourseLoadError] = useState('')

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

  const loadCourses = async () => {
    setLoadingCourses(true)
    setCourseLoadError('')
    try {
      const { data } = await api.get('/courses')
      const list = Array.isArray(data)
        ? data
        : (data?.data ?? data?.courses ?? data?.data?.courses ?? [])
      setCourses(list)
    } catch (err) {
      // Do NOT fall back to mock course names here — submitting with a
      // fake courseId is exactly the bug we're fixing. Block submission
      // instead and surface the failure clearly.
      setCourseLoadError('Unable to load courses from the server. Registration is disabled until this works.')
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  useEffect(() => {
    loadStudents()
    loadCourses()
  }, [])

  // FIX: clear any pending "hide success message" timer on unmount so we
  // never call setState after the component is gone.
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
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

  const extractBackendMessage = (err) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === 'string' ? err.response.data : null) ||
    err?.message

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    // FIX: clear any success banner left over from a previous
    // registration before starting a new attempt, so it can't linger
    // on screen alongside a new validation error or a new result.
    setSuccess(false)
    setRegisteredProfile(null)
    if (!validate()) return

    setSubmitting(true)

    // Step 1: register the account. CONFIRMED (authController.js):
    // this ALSO auto-creates the linked Student profile — the backend
    // generates its own studentId (e.g. "STU-LX7K9F"); it does not
    // accept a custom one at this step.
    let profile
    try {
      const result = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'student',
        phone: form.phone,
      })
      profile = result?.profile
      if (!profile?._id) {
        throw new Error('Registration succeeded, but no profile ID was returned to complete setup.')
      }
    } catch (err) {
      // FIX: this catch now covers ONLY step 1 (account creation).
      // No account exists yet, so "failed to add student" is accurate here.
      setSubmitting(false)
      const backendMsg = extractBackendMessage(err)
      setServerError(
        err?.response?.status === 409
          ? (backendMsg || 'A user with this email already exists.')
          : (backendMsg || 'Failed to register student account. Please try again.')
      )
      return
    }

    // FIX (the actual bug you're seeing): registration itself already
    // succeeded here — per authController.js, the Student profile is
    // created as part of Step 1. The previous version only showed
    // "success" AFTER Step 2 (updateStudent) also succeeded, so if
    // Step 2 failed for any reason (e.g. a courseId issue), the user saw
    // nothing — no success message, no data — despite the account
    // existing.
    //
    // Fix: build and show the registered student's data now, from
    // what Step 1 + the form already give us. Step 2 becomes a
    // best-effort enhancement — if it fails, we keep showing success
    // and just attach a small warning, instead of hiding everything.
    const selectedCourse = courses.find((c) => c._id === form.course)
    const submittedForm = { ...form }
    const registeredData = {
      studentId: profile.studentId,
      name: submittedForm.name,
      email: submittedForm.email,
      phone: submittedForm.phone,
      address: submittedForm.address,
      courseName: selectedCourse?.name || '',
      joiningDate: submittedForm.joiningDate,
      detailsWarning: '',
    }

    setForm(initialForm)
    setErrors({})

    // Step 2: fill in the fields register didn't collect, using the
    // Student document's real Mongo _id (profile._id) — CONFIRMED
    // correct target for PUT /students/:id. Best-effort: failure here
    // no longer hides the success state set below.
    try {
      await studentService.updateStudent(profile._id, {
        courseId: submittedForm.course, // real Course _id (see loadCourses) — CONFIRMED via models/Student.js (courseId: ObjectId ref Course)
        joiningDate: submittedForm.joiningDate, // CONFIRMED via models/Student.js (Date, default Date.now)
        phone: submittedForm.phone,
        address: submittedForm.address, // CONFIRMED via models/Student.js
      })
    } catch (err) {
      const backendMsg = extractBackendMessage(err)
      registeredData.detailsWarning =
        'Course/phone/joining date could not be saved' +
        (backendMsg ? `: ${backendMsg}. ` : '. ') +
        'You can add these from the student\'s profile page.'
    }

    setSubmitting(false)
    setSuccess(true)
    setRegisteredProfile(registeredData)
    await loadStudents()

    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    // Longer than before (was 3s) since there's now more to read.
    successTimeoutRef.current = setTimeout(() => setSuccess(false), 6000)
  }

  const courseFieldDisabled = loadingCourses || !!courseLoadError

  return (
    <Layout breadcrumb={['Trainer', 'Students', 'Add Student']}>
      <h4 className="font-display fw-bold mb-4">Add Student</h4>

      {success && registeredProfile && (
        <div className="alert alert-success py-2 small">
          <div className="fw-semibold mb-2">
            <i className="bi bi-check-circle me-2"></i>Student registered successfully!
          </div>
          <div className="row row-cols-2 row-cols-md-3 g-1 mb-0">
            <div><span className="text-muted">Student ID:</span> <strong>{registeredProfile.studentId}</strong></div>
            <div><span className="text-muted">Name:</span> <strong>{registeredProfile.name}</strong></div>
            <div><span className="text-muted">Email (login):</span> <strong>{registeredProfile.email}</strong></div>
            <div><span className="text-muted">Phone:</span> <strong>{registeredProfile.phone}</strong></div>
            <div><span className="text-muted">Address:</span> <strong>{registeredProfile.address || '—'}</strong></div>
            <div><span className="text-muted">Course:</span> <strong>{registeredProfile.courseName || '—'}</strong></div>
            <div><span className="text-muted">Joining Date:</span> <strong>{registeredProfile.joiningDate}</strong></div>
          </div>
          {registeredProfile.detailsWarning && (
            <div className="text-warning mt-2 mb-0">
              <i className="bi bi-exclamation-triangle me-1"></i>{registeredProfile.detailsWarning}
            </div>
          )}
        </div>
      )}
      {serverError && (
        <div className="alert alert-danger py-2 small">{serverError}</div>
      )}
      {courseLoadError && (
        <div className="alert alert-warning py-2 small">{courseLoadError}</div>
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
              <label className="form-label small fw-semibold">Address</label>
              <input className="form-control" value={form.address} onChange={handleChange('address')} placeholder="Optional" />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Course</label>
              <select
                className={`form-select ${errors.course ? 'is-invalid' : ''}`}
                value={form.course}
                onChange={handleChange('course')}
                disabled={courseFieldDisabled}
              >
                <option value="">{loadingCourses ? 'Loading courses...' : 'Select a course'}</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
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
          <button className="btn btn-primary-stms" disabled={submitting || courseFieldDisabled}>
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
                  <th>Address</th>
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
                    <td>{s.address}</td>
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