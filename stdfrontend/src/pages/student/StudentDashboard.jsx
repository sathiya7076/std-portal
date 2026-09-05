import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import ProgressBar from '../../components/ProgressBar'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'
import taskService from '../../services/taskService'
import feeService from '../../services/feeService'
import notificationService from '../../services/notificationService'

const safeAvg = (arr, key) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0
  const sum = arr.reduce((s, p) => s + (Number(p?.[key]) || 0), 0)
  return Math.round(sum / arr.length)
}

// Unwraps a Promise.allSettled result: returns the value, or `fallback` + logs on rejection
const resolveOr = (result, fallback, label) => {
  if (result.status === 'fulfilled') return result.value
  console.error(`${label} failed:`, result.reason)
  return fallback
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: null, data: null, partialErrors: [] })

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setState({ loading: true, error: null, data: null, partialErrors: [] })

      const results = await Promise.allSettled([
        studentService.getProfile(),
        studentService.getAttendance(),
        studentService.getLearningProgress(),
        taskService.getStudentTasks(),
        feeService.getMyFees(),
        notificationService.getAll(),
      ])

      if (!isMounted) return

      const [profileR, attendanceR, progressR, tasksR, feesR, notificationsR] = results

      const profile = resolveOr(profileR, null, 'getProfile')
      const attendance = resolveOr(attendanceR, null, 'getAttendance')
      const progress = resolveOr(progressR, [], 'getLearningProgress')
      const tasks = resolveOr(tasksR, [], 'getStudentTasks')
      const fees = resolveOr(feesR, null, 'getMyFees')
      const notifications = resolveOr(notificationsR, [], 'getAll (notifications)')

      // If literally everything failed, show the full error state
      const allFailed = results.every((r) => r.status === 'rejected')
      if (allFailed) {
        setState({
          loading: false,
          error: 'Could not load your dashboard right now.',
          data: null,
          partialErrors: [],
        })
        return
      }

      const taskList = Array.isArray(tasks) ? tasks : []
      const notifList = Array.isArray(notifications) ? notifications : []
      const partialErrors = results
        .map((r, i) => (r.status === 'rejected' ? ['profile', 'attendance', 'progress', 'tasks', 'fees', 'notifications'][i] : null))
        .filter(Boolean)

      setState({
        loading: false,
        error: null,
        partialErrors,
        data: {
          profile: {
            name: profile?.name ?? user?.name ?? 'Student',
            studentId: profile?.studentId ?? profile?.id ?? '—',
            course: (typeof profile?.course === 'object' ? profile.course?.name : profile?.course) ?? profile?.courseName ?? 'Not assigned',
            email: profile?.email ?? '—',
            phone: profile?.phone ?? profile?.contactNumber ?? '—',
          },
          attendance: {
            percentage: attendance?.percentage ?? 0,
            totalWorkingDays: attendance?.totalWorkingDays ?? 0,
            present: attendance?.present ?? 0,
            absent: attendance?.absent ?? 0,
            unavailable: !attendance,
          },
          overallProgress: safeAvg(progress, 'percent'),
          pendingTasks: taskList.filter((t) => t?.status === 'Pending').length,
          completedTasks: taskList.filter((t) => t?.status === 'Completed').length,
          pendingFees: Number(fees?.pendingAmount) || 0,
          unreadNotifications: notifList.filter((n) => !n?.read).length,
        },
      })
    }

    load()
    return () => { isMounted = false }
  }, [user?.id])

  const breadcrumb = ['Student', 'Dashboard']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading your dashboard..." /></Layout>
  if (state.error) return (
    <Layout breadcrumb={breadcrumb}>
      <ErrorMessage message={state.error} onRetry={() => setState((s) => ({ ...s, loading: true }))} />
    </Layout>
  )

  const d = state.data
  const cards = [
    { label: 'Attendance', value: d.attendance.unavailable ? '—' : `${d.attendance.percentage}%`, icon: 'bi-calendar-check', bg: 'bg-teal-soft' },
    { label: 'Learning Progress', value: `${d.overallProgress}%`, icon: 'bi-graph-up-arrow', bg: 'bg-indigo-soft' },
    { label: 'Pending Tasks', value: d.pendingTasks, icon: 'bi-hourglass-split', bg: 'bg-amber-soft' },
    { label: 'Completed Tasks', value: d.completedTasks, icon: 'bi-check2-circle', bg: 'bg-teal-soft' },
    { label: 'Pending Fees', value: `₹${d.pendingFees.toLocaleString('en-IN')}`, icon: 'bi-cash-coin', bg: 'bg-coral-soft' },
    { label: 'Unread Notifications', value: d.unreadNotifications, icon: 'bi-bell', bg: 'bg-indigo-soft' },
  ]

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-1">Welcome, {d.profile.name.split(' ')[0]} 👋</h4>
      <p className="text-muted mb-4">Here's a snapshot of your training journey today.</p>

      {state.partialErrors.length > 0 && (
        <div className="alert alert-warning py-2 px-3 mb-3 small">
          Some data couldn't be loaded right now: {state.partialErrors.join(', ')}.
        </div>
      )}

      <div className="row">
        <div className="col-12 mb-4">
          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3"><i className="bi bi-person-badge me-2 text-indigo"></i>Student Details</h6>
            <div className="row">
              <div className="col-sm-6 col-lg-3 mb-3 mb-lg-0">
                <div className="text-muted small">Name</div>
                <div className="fw-semibold">{d.profile.name}</div>
              </div>
              <div className="col-sm-6 col-lg-3 mb-3 mb-lg-0">
                <div className="text-muted small">Student ID</div>
                <div className="fw-semibold">{d.profile.studentId}</div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="text-muted small">Course</div>
                <div className="fw-semibold">{d.profile.course}</div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="text-muted small">Contact</div>
                <div className="fw-semibold">{d.profile.email}</div>
                <div className="text-muted small">{d.profile.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {cards.map((c) => (
          <div className="col-sm-6 col-lg-4 col-xl-2" key={c.label}>
            <div className="stat-card mb-4">
              <span className={`stat-icon ${c.bg}`}><i className={`bi ${c.icon}`}></i></span>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="surface-card p-4 h-100">
            <h6 className="fw-semibold mb-3"><i className="bi bi-calendar-check me-2 text-teal"></i>Attendance Overview</h6>
            {d.attendance.unavailable ? (
              <p className="text-muted small mb-0">Attendance data is temporarily unavailable.</p>
            ) : (
              <>
                <ProgressBar label="Overall Attendance" percent={d.attendance.percentage} />
                <div className="row text-center mt-3">
                  <div className="col">
                    <div className="fw-bold fs-5">{d.attendance.totalWorkingDays}</div>
                    <div className="text-muted small">Working Days</div>
                  </div>
                  <div className="col">
                    <div className="fw-bold fs-5 text-teal">{d.attendance.present}</div>
                    <div className="text-muted small">Present</div>
                  </div>
                  <div className="col">
                    <div className="fw-bold fs-5 text-danger">{d.attendance.absent}</div>
                    <div className="text-muted small">Absent</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="surface-card p-4 h-100">
            <h6 className="fw-semibold mb-3"><i className="bi bi-graph-up-arrow me-2 text-indigo"></i>Learning Progress</h6>
            <ProgressBar label="Overall Completion" percent={d.overallProgress} />
            <p className="text-muted small mb-0 mt-3">
              Keep going — visit <strong>Student Profile</strong> for a full skill-by-skill breakdown.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}