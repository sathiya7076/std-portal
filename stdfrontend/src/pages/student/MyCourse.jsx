import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import MaterialCard from '../../components/MaterialCard'
import { useAuth } from '../../context/AuthContext'
import courseService from '../../services/courseService'
import materialService from '../../services/materialService'

const formatINR = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—'
}

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

    const userCourseId = user?.courseId ?? user?.course_id
    let course = null

    try {
      const courses = await courseService.getAllCourses()

      if (!Array.isArray(courses) || courses.length === 0) {
        console.warn('[DEBUG] getAllCourses returned empty/invalid:', courses)
        setState({
          loading: false,
          error: 'Unable to load course list right now.',
          course: null,
          materials: [],
          materialsError: null,
        })
        return
      }

      if (userCourseId != null) {
        course = courses.find((c) => String(c.id ?? c._id) === String(userCourseId))
      }
      if (!course && user?.course) {
        course = courses.find((c) => c.name === user.course)
      }

      console.log('[DEBUG] user object:', user)
      console.log('[DEBUG] userCourseId:', userCourseId)
      console.log('[DEBUG] user.course:', user?.course)
      console.log('[DEBUG] courses list:', courses)
      console.log('[DEBUG] matched course:', course)

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
    } catch (err) {
      console.error('[DEBUG] getAllCourses failed:', {
        status: err?.response?.status,
        body: err?.response?.data,
        message: err?.message,
      })
      setState({
        loading: false,
        error: 'Unable to load your course.',
        course: null,
        materials: [],
        materialsError: null,
      })
      return
    }

    try {
      const courseId = course.id ?? course._id
      const materials = await materialService.getMaterialsByCourse(courseId)
      setState({ loading: false, error: null, course, materials: materials || [], materialsError: null })
    } catch (err) {
      console.warn('[DEBUG] getMaterialsByCourse failed:', {
        status: err?.response?.status,
        body: err?.response?.data,
        message: err?.message,
      })
      setState({
        loading: false,
        error: null,
        course,
        materials: [],
        materialsError: 'Unable to load materials right now.',
      })
    }
  }

  useEffect(() => {
    console.log('[DEBUG] useEffect fired, user is:', user)
    if (!user) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.courseId, user?.course_id, user?.course])

  const breadcrumb = ['Student', 'Courses', 'My Course']

  if (!user || state.loading) {
    return (
      <Layout breadcrumb={breadcrumb}>
        <Loading message="Loading your course..." />
      </Layout>
    )
  }

  if (state.error) {
    return (
      <Layout breadcrumb={breadcrumb}>
        <ErrorMessage message={state.error} onRetry={load} />
      </Layout>
    )
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
            <div className="fw-semibold">{user?.studentId ?? '—'}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Assigned Course</div>
            <div className="fw-semibold">{state.course.name}</div>
          </div>
          <div className="col-md-4 mb-2">
            <div className="text-muted small">Course Fees</div>
            <div className="fw-semibold">{formatINR(state.course.fees)}</div>
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