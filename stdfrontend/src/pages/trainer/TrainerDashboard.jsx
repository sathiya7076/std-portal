import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ProgressBar from '../../components/ProgressBar'
import studentService from '../../services/studentService'

// Trainer Dashboard — lists every registered student with their
// attendance % and learning progress %, so a trainer can scan the
// whole cohort at a glance instead of opening each profile.
//
// Uses studentService.getAllStudents(), which already returns
// normalized student objects (see normalizeStudent in
// studentService.js): s._id is the Mongo id (used for links),
// s.studentId is the human-readable code (display only).

export default function TrainerDashboard() {
  const [state, setState] = useState({ loading: true, error: null, students: [] })
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const students = await studentService.getAllStudents({ search, course })
      setState({ loading: false, error: null, students })
    } catch {
      setState({ loading: false, error: 'Unable to load students.', students: [] })
    }
  }

  // Reload whenever the trainer changes filters. If you'd rather
  // filter client-side only, drop `search`/`course` from the deps
  // and instead filter `state.students` below.
  useEffect(() => { load() }, [search, course])

  const courses = [...new Set(state.students.map((s) => s.course).filter(Boolean))]

  return (
    <Layout breadcrumb={['Trainer', 'Dashboard']}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h4 className="font-display fw-bold mb-0">Student Progress</h4>
        <Link to="/trainer/students/register" className="btn btn-primary btn-sm">
          <i className="bi bi-person-plus me-1"></i>Register Student
        </Link>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-4">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ maxWidth: 260 }}
          placeholder="Search by name or student ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 200 }}
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {state.loading && <Loading message="Loading students..." />}
      {!state.loading && state.error && (
        <ErrorMessage message={state.error} onRetry={load} />
      )}
      {!state.loading && !state.error && state.students.length === 0 && (
        <EmptyState
          icon="bi-people"
          title="No students registered yet"
          description="Register a student to start tracking their progress."
        />
      )}

      {!state.loading && !state.error && state.students.length > 0 && (
        <div className="row">
          {state.students.map((s) => (
            <div className="col-lg-6 mb-4" key={s._id}>
              <div className="surface-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="fw-semibold mb-1">{s.name}</h6>
                    <p className="text-muted small mb-0">{s.studentId} • {s.course}</p>
                  </div>
                  <Link
                    to={`/trainer/students/${s._id}`}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    View
                  </Link>
                </div>
                <ProgressBar label="Attendance" percent={s.attendance} />
                <ProgressBar label="Learning Progress" percent={s.progress} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}