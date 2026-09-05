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
  const [state, setState] = useState({
    loading: true,
    error: null,
    course: null,
    materials: [],
    materialsError: null,
  })

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null, materialsError: null }))

    let course = null
    try {
      const courses = await courseService.getAllCourses()

      // Match by course id first (most reliable), fall back to matching by name
      // in case the logged-in user object only stores the course name.
      course = courses.find(
        (c) => String(c.id ?? c._id) === String(user?.courseId ?? user?.course_id)
      ) || courses.find((c) => c.name === user?.course)

      if (!course) {
        setState({
          loading: false,
          error: 'No course assigned to your account yet.',
          course: null,
          materials: [],
          materialsError: null,
        })
        return
      }
    } catch {
      setState({
        loading: false,
        error: 'Unable to load your course.',
        course: null,
        materials: [],
        materialsError: null,
      })
      return
    }

    // Materials are fetched separately so a materials failure never
    // hides the course/fees/duration info you already loaded.
    try {
      const courseId = course.id ?? course._id
      const materials = await materialService.getMaterialsByCourse(courseId)
      setState({ loading: false, error: null, course, materials: materials || [], materialsError: null })
    } catch {
      setState({
        loading: false,
        error: null,
        course,
        materials: [],
        materialsError: 'Unable to load materials right now.',
      })
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const breadcrumb = ['Student', 'Courses', 'My Course']

  if (state.loading) {
    return <Layout breadcrumb={breadcrumb}><Loading message="Loading your course..." /></Layout>
  }

  if (state.error) {
    return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>
  }

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-4">My Course</h4>

      <div className="surface-card p-4 mb-4">
        <div className="row">
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Student Name</div>
            <div className="fw-semibold">{user?.name}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Student ID</div>
            <div className="fw-semibold">{user?.id ?? user?._id}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Assigned Course</div>
            <div className="fw-semibold">{state.course.name}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Course Fees</div>
            <div className="fw-semibold">{state.course.fees}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Duration</div>
            <div className="fw-semibold">{state.course.duration}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Roadmap</div>
            <div className="fw-semibold">{state.course.roadmap}</div>
          </div>
        </div>
        {state.course.description && (
          <div className="mt-3">
            <div className="text-muted small">Full Details</div>
            <div>{state.course.description}</div>
          </div>
        )}
      </div>

      <h6 className="fw-semibold mb-3">My Study Materials</h6>

      {state.materialsError && (
        <ErrorMessage message={state.materialsError} onRetry={load} />
      )}

      {!state.materialsError && state.materials.length === 0 && (
        <EmptyState
          icon="bi-folder2-open"
          title="No materials yet"
          message="Your trainer hasn't uploaded materials for this course yet."
        />
      )}

      {!state.materialsError && state.materials.length > 0 && (
        <div className="row">
          {state.materials.map((m) => (
            <MaterialCard key={m.id ?? m._id} material={m} />
          ))}
        </div>
      )}
    </Layout>
  )
}