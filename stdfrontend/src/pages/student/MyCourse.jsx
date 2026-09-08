import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import MaterialCard from '../../components/MaterialCard'
import { useAuth } from '../../context/AuthContext'
import courseService from '../../services/courseService'
import materialService from '../../services/materialService'
import studentService from '../../services/studentService' // ADDED: user (auth context) doesn't carry course info — the Student profile does

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
    profile: null, // ADDED: studentId lives on the Student profile, not on `user` (auth context) — CONFIRMED via [DEBUG] logs
  })

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null, materialsError: null }))

    let course = null

    try {
      // ADDED: fetch the Student profile — CONFIRMED (via [DEBUG] logs)
      // that useAuth()'s `user` only carries auth/login fields (id,
      // name, email, role) — never course info. The real course
      // assignment lives on the Student document, same source
      // StudentFees.jsx already uses via studentService.getProfile().
      const profile = await studentService.getProfile()
      console.log('[DEBUG] student profile:', profile)

      // FIXED: CONFIRMED via [DEBUG] log that profile.course is already
      // the populated course object itself ({_id, name, ...}), not a
      // plain name string, and profile.courseId doesn't exist on this
      // object at all. Previously this compared a string to an object
      // and could never match. Handle both possible shapes (populated
      // object vs plain name string) so this keeps working either way.
      const profileCourse = profile?.course
      const profileCourseId =
        typeof profileCourse === 'object' ? profileCourse?._id ?? profileCourse?.id : undefined
      const profileCourseName =
        typeof profileCourse === 'object' ? profileCourse?.name : profileCourse

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

      // Match by ID first (most reliable), fall back to matching by name.
      if (profileCourseId != null) {
        course = courses.find((c) => String(c.id ?? c._id) === String(profileCourseId))
      }
      if (!course && profileCourseName) {
        course = courses.find((c) => c.name === profileCourseName)
      }

      console.log('[DEBUG] profileCourseId:', profileCourseId)
      console.log('[DEBUG] profileCourseName:', profileCourseName)
      console.log('[DEBUG] courses list:', courses)
      console.log('[DEBUG] matched course:', course)

      if (!course) {
        setState({
          loading: false,
          error: 'No course assigned to your account yet.',
          course: null,
          materials: [],
          materialsError: null,
          profile, // ADDED: keep profile even in the "no course" error state, in case studentId is still shown elsewhere
        })
        return
      }

      try {
        const courseId = course.id ?? course._id
        const materials = await materialService.getMaterialsByCourse(courseId)
        setState({ loading: false, error: null, course, materials: materials || [], materialsError: null, profile })
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
          profile, // ADDED
        })
      }
    } catch (err) {
      console.error('[DEBUG] load failed:', {
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
        profile: null,
      })
      return
    }
  }

  useEffect(() => {
    console.log('[DEBUG] useEffect fired, user is:', user)
    if (!user) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
            {/* FIXED: studentId only exists on the Student profile, never on
                `user` from useAuth() — CONFIRMED via [DEBUG] logs (user only
                has id/name/email/role). Read it from state.profile instead. */}
            <div className="fw-semibold">{state.profile?.studentId ?? '—'}</div>
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