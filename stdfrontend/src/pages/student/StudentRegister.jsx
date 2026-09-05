import React, { useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'

export default function StudentRegister() {
  const { user } = useAuth()
  const [marking, setMarking] = useState(false)
  const [marked, setMarked] = useState(false)
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState(null)

  const loadDetails = async () => {
    setLoadingDetails(true)
    setError(null)
    try {
      const [profile, attendance] = await Promise.all([
        studentService.getProfile(),       // GET /api/student/profile
        studentService.getMyAttendance(),  // GET /api/attendance/me — add if missing from studentService.js
      ])
      setDetails({
        name: profile?.name ?? user?.name ?? '—',
        studentId: profile?.studentId ?? '—',
        course: profile?.course?.name ?? 'Not assigned',
        email: profile?.email ?? '—',
        totalWorkingDays: attendance?.totalWorkingDays ?? 0,
        present: attendance?.present ?? 0,
        absent: attendance?.absent ?? 0,
        percentage: attendance?.percentage ?? 0,
      })
    } catch (e) {
      console.error('Failed to load student details:', e)
      setError('Could not load your details right now.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleMarkAttendance = async () => {
    setMarking(true)
    setError(null)
    try {
      await studentService.markMyAttendance() // POST /api/attendance/checkin — add if missing from studentService.js
      setMarked(true)
      await loadDetails()
    } catch (e) {
      const message = e?.response?.data?.message
      console.error('Attendance check-in failed:', e)
      setError(message === 'Attendance already recorded for today'
        ? 'You have already marked attendance for today.'
        : 'Could not mark attendance. Please try again.')
    } finally {
      setMarking(false)
    }
  }

  return (
    <Layout breadcrumb={['Student', 'Attendance Register']}>
      <h4 className="font-display fw-bold mb-1">Attendance Register</h4>
      <p className="text-muted mb-4">Mark your attendance for today and view your record.</p>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3 small">{error}</div>
      )}

      <div className="row">
        <div className="col-lg-5 mb-4">
          <div className="surface-card p-4 text-center h-100">
            <p className="text-muted small mt-3 mb-3">
              {marked ? '✓ Attendance Marked for Today' : 'Click below to mark your attendance for today.'}
            </p>
            <button className="btn btn-primary-stms" onClick={handleMarkAttendance} disabled={marking || marked}>
              {marking ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Marking...</>
              ) : marked ? (
                <><i className="bi bi-check-circle me-1"></i>Marked Present</>
              ) : (
                'Mark My Attendance'
              )}
            </button>
          </div>
        </div>

        <div className="col-lg-7 mb-4">
          <div className="surface-card p-4 h-100">
            <h6 className="fw-semibold mb-3">Student Details</h6>
            {!marked ? (
              <p className="text-muted small">Details will appear here once you mark today's attendance.</p>
            ) : loadingDetails || !details ? (
              <p className="text-muted small">Loading your details...</p>
            ) : (
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="text-muted">Student Name</td><td className="fw-semibold">{details.name}</td></tr>
                  <tr><td className="text-muted">Student ID</td><td className="fw-semibold">{details.studentId}</td></tr>
                  <tr><td className="text-muted">Course</td><td className="fw-semibold">{details.course}</td></tr>
                  <tr><td className="text-muted">Email</td><td className="fw-semibold">{details.email}</td></tr>
                  <tr><td className="text-muted">Total Working Days</td><td className="fw-semibold">{details.totalWorkingDays}</td></tr>
                  <tr><td className="text-muted">Present</td><td className="fw-semibold text-teal">{details.present}</td></tr>
                  <tr><td className="text-muted">Absent</td><td className="fw-semibold text-danger">{details.absent}</td></tr>
                  <tr><td className="text-muted">Attendance</td><td className="fw-semibold">{details.percentage}%</td></tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}