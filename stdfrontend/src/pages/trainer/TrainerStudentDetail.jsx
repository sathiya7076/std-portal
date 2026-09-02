import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ProgressBar from '../../components/ProgressBar'
import studentService from '../../services/studentService'

export default function TrainerStudentDetail() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: null, student: null })

  const load = async () => {
    setState({ loading: true, error: null, student: null })
    try {
      const student = await studentService.getStudentById(id)
      setState({ loading: false, error: null, student })
    } catch {
      setState({ loading: false, error: 'Unable to load this student.', student: null })
    }
  }

  useEffect(() => { load() }, [id])

  const breadcrumb = ['Trainer', 'Students', state.student?.name || '...']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading student..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>
  if (!state.student) return <Layout breadcrumb={breadcrumb}><EmptyState icon="bi-person-x" title="Student not found" /></Layout>

  const s = state.student

  return (
    <Layout breadcrumb={breadcrumb}>
      <Link to="/trainer/students" className="text-decoration-none small text-muted d-inline-flex align-items-center mb-3">
        <i className="bi bi-arrow-left me-1"></i> Back to Students
      </Link>

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h4 className="font-display fw-bold mb-1">{s.name}</h4>
          <p className="text-muted mb-0">{s.id} • {s.course}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm"><i className="bi bi-pencil me-1"></i>Edit</button>
          <button className="btn btn-outline-danger btn-sm"><i className="bi bi-trash me-1"></i>Delete</button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3">Student Details</h6>
            <table className="table table-borderless mb-0">
              <tbody>
                <tr><td className="text-muted">Student Name</td><td className="fw-semibold">{s.name}</td></tr>
                <tr><td className="text-muted">Student ID</td><td className="fw-semibold">{s.id}</td></tr>
                <tr><td className="text-muted">Course</td><td className="fw-semibold">{s.course}</td></tr>
                <tr><td className="text-muted">Email</td><td className="fw-semibold">{s.email}</td></tr>
                <tr><td className="text-muted">Phone</td><td className="fw-semibold">{s.phone}</td></tr>
                <tr><td className="text-muted">Address</td><td className="fw-semibold">{s.address}</td></tr>
                <tr><td className="text-muted">Total Working Days</td><td className="fw-semibold">{s.totalWorkingDays}</td></tr>
                <tr><td className="text-muted">Present</td><td className="fw-semibold text-teal">{s.present}</td></tr>
                <tr><td className="text-muted">Absent</td><td className="fw-semibold text-danger">{s.absent}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="surface-card p-4 mb-4">
            <h6 className="fw-semibold mb-3">Attendance & Progress</h6>
            <ProgressBar label="Attendance Percentage" percent={s.attendance} />
            <ProgressBar label="Learning Progress" percent={s.progress} />
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-secondary btn-sm flex-fill"><i className="bi bi-calendar-check me-1"></i>View Attendance</button>
            <button className="btn btn-outline-secondary btn-sm flex-fill"><i className="bi bi-clipboard-check me-1"></i>View Tasks</button>
            <button className="btn btn-outline-secondary btn-sm flex-fill"><i className="bi bi-graph-up me-1"></i>View Progress</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
