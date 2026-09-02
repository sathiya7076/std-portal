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

export default function StudentDashboard() {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = async () => {
    setState({ loading: true, error: null, data: null })
    try {
      const [attendance, progress, tasks, fees, notifications] = await Promise.all([
        studentService.getAttendance(),
        studentService.getLearningProgress(),
        taskService.getStudentTasks(),
        feeService.getMyFees(),
        notificationService.getAll(),
      ])
      setState({
        loading: false,
        error: null,
        data: {
          attendance,
          overallProgress: Math.round(progress.reduce((s, p) => s + p.percent, 0) / progress.length),
          pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
          completedTasks: tasks.filter((t) => t.status === 'Completed').length,
          pendingFees: fees.pendingAmount,
          unreadNotifications: notifications.filter((n) => !n.read).length,
        },
      })
    } catch (e) {
      setState({ loading: false, error: 'Could not load your dashboard right now.', data: null })
    }
  }

  useEffect(() => { load() }, [])

  const breadcrumb = ['Student', 'Dashboard']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading your dashboard..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const d = state.data
  const cards = [
    { label: 'Attendance', value: `${d.attendance.percentage}%`, icon: 'bi-calendar-check', bg: 'bg-teal-soft' },
    { label: 'Learning Progress', value: `${d.overallProgress}%`, icon: 'bi-graph-up-arrow', bg: 'bg-indigo-soft' },
    { label: 'Pending Tasks', value: d.pendingTasks, icon: 'bi-hourglass-split', bg: 'bg-amber-soft' },
    { label: 'Completed Tasks', value: d.completedTasks, icon: 'bi-check2-circle', bg: 'bg-teal-soft' },
    { label: 'Pending Fees', value: `₹${d.pendingFees.toLocaleString('en-IN')}`, icon: 'bi-cash-coin', bg: 'bg-coral-soft' },
    { label: 'Unread Notifications', value: d.unreadNotifications, icon: 'bi-bell', bg: 'bg-indigo-soft' },
  ]

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-1">Welcome, {user?.name?.split(' ')[0]} 👋</h4>
      <p className="text-muted mb-4">Here's a snapshot of your training journey today.</p>

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
