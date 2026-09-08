import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import MaterialCard from '../../components/MaterialCard'
import courseService from '../../services/courseService'
import materialService from '../../services/materialService'

export default function StudentCourseDetail() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: null, course: null, materials: [] })

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const courses = await courseService.getAllCourses()
      // ADDED: debug — confirm whether course objects actually have an
      // `id` field, or only `_id` (this was the exact bug in MyCourse.jsx).
      console.log('[DEBUG] URL param id:', id)
      console.log('[DEBUG] courses list:', courses)
      if (courses[0]) {
        console.log('[DEBUG] first course.id:', courses[0].id)
        console.log('[DEBUG] first course._id:', courses[0]._id)
      }

      const course = courses.find((c) => String(c.id) === String(id))
      // ADDED: debug — see what actually got matched (or didn't)
      console.log('[DEBUG] matched course:', course)

      if (!course) {
        setState({ loading: false, error: 'Course not found.', course: null, materials: [] })
        return
      }
      // ADDED: debug — this is the exact value being sent to fetch materials
      console.log('[DEBUG] course.id passed to getMaterialsByCourse:', course.id)

      const materials = await materialService.getMaterialsByCourse(course.id)
      // ADDED: debug — see what came back
      console.log('[DEBUG] materials returned:', materials)

      setState({ loading: false, error: null, course, materials })
    } catch (err) {
      // ADDED: debug — surface the real error instead of swallowing it silently
      console.error('[DEBUG] load failed:', {
        status: err?.response?.status,
        body: err?.response?.data,
        message: err?.message,
      })
      setState({ loading: false, error: 'Unable to load this course.', course: null, materials: [] })
    }
  }

  useEffect(() => { load() }, [id])

  const breadcrumb = ['Student', 'Courses', 'Details']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading course..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-4">{state.course.name}</h4>

      <div className="surface-card p-4 mb-4">
        <div className="row">
          <div className="col-md-3 mb-2">
            <div className="text-muted small">Fees</div>
            <div className="fw-semibold">{state.course.fees}</div>
          </div>
          <div className="col-md-3 mb-2">
            <div className="text-muted small">Duration</div>
            <div className="fw-semibold">{state.course.duration}</div>
          </div>
          <div className="col-md-6 mb-2">
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

      <h6 className="fw-semibold mb-3">Uploaded Materials</h6>
      {state.materials.length === 0 ? (
        <EmptyState
          icon="bi-folder2-open"
          title="No materials yet"
          message="The trainer hasn't uploaded materials for this course yet."
        />
      ) : (
        <div className="row">
          {state.materials.map((m) => <MaterialCard key={m.id} material={m} />)}
        </div>
      )}
    </Layout>
  )
}