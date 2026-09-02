import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import ProgressBar from '../../components/ProgressBar'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'
import courseService from '../../services/courseService'
import taskService from '../../services/taskService'
import materialService from '../../services/materialService'

export default function TrainerDashboard() {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = async () => {
    setState({ loading: true, error: null, data: null })
    try {
      const [students, courses, tasks, materials] = await Promise.all([
        studentService.getAllStudents(),
        courseService.getAllCourses(),
        taskService.getStudentTasks(),
        materialService.getAllMaterials(),
      ])
      setState({
        loading: false,
        error: null,
        data: {
          totalStudents: students.length,
          totalCourses: courses.length,
          todaysAttendance: 92,
          pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
          submittedTasks: tasks.filter((t) => t.status === 'Submitted').length,
          totalMaterials: materials.length,
          students,
        },
      })
    } catch {
      setState({ loading: false, error: 'Could not load the dashboard.', data: null })
    }
  }

  useEffect(() => { load() }, [])

  const breadcrumb = ['Trainer', 'Dashboard']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading dashboard..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const d = state.data
  const cards = [
    { label: 'Total Students', value: d.totalStudents, icon: 'bi-people', bg: 'bg-indigo-soft' },
    { label: 'Total Courses', value: d.totalCourses, icon: 'bi-mortarboard', bg: 'bg-teal-soft' },
    { label: "Today's Attendance", value: `${d.todaysAttendance}%`, icon: 'bi-calendar-check', bg: 'bg-teal-soft' },
    { label: 'Pending Tasks', value: d.pendingTasks, icon: 'bi-hourglass-split', bg: 'bg-amber-soft' },
    { label: 'Submitted Tasks', value: d.submittedTasks, icon: 'bi-inbox', bg: 'bg-indigo-soft' },
    { label: 'Total Materials', value: d.totalMaterials, icon: 'bi-folder2-open', bg: 'bg-indigo-soft' },
  ]

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-1">Welcome, {user?.name} 👋</h4>
      <p className="text-muted mb-4">Here's how your students and courses are doing today.</p>

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

      <div className="surface-card p-4">
        <h6 className="fw-semibold mb-3">Student Progress Overview</h6>
        {d.students.slice(0, 5).map((s) => (
          <ProgressBar key={s.id} label={`${s.name} — ${s.course}`} percent={s.progress} />
        ))}
      </div>
    </Layout>
  )
}
