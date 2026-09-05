import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import ProgressBar from '../../components/ProgressBar'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'

export default function StudentDetails() {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = async () => {
    setState({ loading: true, error: null, data: null })
    try {
      const attendance = await studentService.getAttendance()
      setState({ loading: false, error: null, data: { attendance } })
    } catch (e) {
      setState({ loading: false, error: 'Could not load student details right now.', data: null })
    }
  }

  useEffect(() => { load() }, [])

  const breadcrumb = ['Student', 'Student Details']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading student details..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const { attendance: a } = state.data

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-1">Student Details</h4>
      <p className="text-muted mb-4">Your registered profile and attendance summary.</p>

      <div className="row">
        <div className="col-lg-5 mb-4">
          <div className="surface-card p-4 text-center h-100">
            <div className={`fingerprint-pad ${user?.fingerprintRegistered ? 'scanned' : ''}`}>
              <i className={`bi ${user?.fingerprintRegistered ? 'bi-fingerprint text-teal' : 'bi-fingerprint'}`}></i>
            </div>
            <p className="text-muted small mt-3 mb-0">
              {user?.fingerprintRegistered ? '✓ Fingerprint Registered' : 'Fingerprint not registered yet'}
            </p>
          </div>
        </div>

        <div className="col-lg-7 mb-4">
          <div className="surface-card p-4 h-100">
            <h6 className="fw-semibold mb-3">Profile</h6>
            <table className="table table-borderless mb-0">
              <tbody>
                <tr><td className="text-muted">Student Name</td><td className="fw-semibold">{user?.name}</td></tr>
                <tr><td className="text-muted">Student ID</td><td className="fw-semibold">{user?.id}</td></tr>
                <tr><td className="text-muted">Course</td><td className="fw-semibold">{user?.course}</td></tr>
                <tr><td className="text-muted">Email</td><td className="fw-semibold">{user?.email}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 mb-4">
          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3"><i className="bi bi-calendar-check me-2 text-teal"></i>Attendance Summary</h6>
            <ProgressBar label="Overall Attendance" percent={a.percentage} />
            <div className="row text-center mt-3">
              <div className="col">
                <div className="fw-bold fs-5">{a.totalWorkingDays}</div>
                <div className="text-muted small">Working Days</div>
              </div>
              <div className="col">
                <div className="fw-bold fs-5 text-teal">{a.present}</div>
                <div className="text-muted small">Present</div>
              </div>
              <div className="col">
                <div className="fw-bold fs-5 text-danger">{a.absent}</div>
                <div className="text-muted small">Absent</div>
              </div>
              <div className="col">
                <div className="fw-bold fs-5">{a.percentage}%</div>
                <div className="text-muted small">Percentage</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}