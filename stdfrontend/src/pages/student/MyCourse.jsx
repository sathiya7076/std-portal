import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import MaterialCard from '../../components/MaterialCard'
import { useAuth } from '../../context/AuthContext'
import courseService from '../../services/courseService'
import materialService from '../../services/materialService'

export default function MyCourse() {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: null, course: null, materials: [] })

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const courses = await courseService.getAllCourses()
      const course = courses.find((c) => c.name === user?.course) || courses[0]
      const materials = await materialService.getMaterialsByCourse(course.id)
      setState({ loading: false, error: null, course, materials })
    } catch {
      setState({ loading: false, error: 'Unable to load your course.', course: null, materials: [] })
    }
  }

  useEffect(() => { load() }, [])

  const breadcrumb = ['Student', 'Courses', 'My Course']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading your course..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-4">My Course</h4>

      <div className="surface-card p-4 mb-4">
        <div className="row">
          <div className="col-md-4 mb-2"><div className="text-muted small">Student Name</div><div className="fw-semibold">{user?.name}</div></div>
          <div className="col-md-4 mb-2"><div className="text-muted small">Student ID</div><div className="fw-semibold">{user?.id}</div></div>
          <div className="col-md-4 mb-2"><div className="text-muted small">Student Course</div><div className="fw-semibold">{state.course?.name}</div></div>
        </div>
      </div>

      <h6 className="fw-semibold mb-3">My Study Materials</h6>
      {state.materials.length === 0 ? (
        <EmptyState icon="bi-folder2-open" title="No materials yet" message="Your trainer hasn't uploaded materials for this course yet." />
      ) : (
        <div className="row">
          {state.materials.map((m) => <MaterialCard key={m.id} material={m} />)}
        </div>
      )}
    </Layout>
  )
}
