import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import courseService from '../../services/courseService'

export default function CourseDetails() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: null, course: null })

  const load = async () => {
    setState({ loading: true, error: null, course: null })
    try {
      const course = await courseService.getCourseById(id)
      setState({ loading: false, error: null, course })
    } catch {
      setState({ loading: false, error: 'Unable to load this course.', course: null })
    }
  }

  useEffect(() => { load() }, [id])

  const breadcrumb = ['Student', 'Courses', state.course?.name || '...']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading course details..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>
  if (!state.course) return <Layout breadcrumb={breadcrumb}><EmptyState icon="bi-mortarboard" title="Course not found" /></Layout>

  const c = state.course

  return (
    <Layout breadcrumb={breadcrumb}>
      <Link to="/student/courses" className="text-decoration-none small text-muted d-inline-flex align-items-center mb-3">
        <i className="bi bi-arrow-left me-1"></i> Back to Courses
      </Link>

      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="surface-card p-4 mb-4">
            <h4 className="font-display fw-bold mb-2">{c.name}</h4>
            <p className="text-muted mb-3">{c.description}</p>
            <div className="row text-center">
              <div className="col-4">
                <div className="fw-bold">{c.duration}</div>
                <div className="text-muted small">Duration</div>
              </div>
              <div className="col-4">
                <div className="fw-bold">₹{c.fees.toLocaleString('en-IN')}</div>
                <div className="text-muted small">Course Fees</div>
              </div>
              <div className="col-4">
                <div className="fw-bold">{c.trainer}</div>
                <div className="text-muted small">Trainer</div>
              </div>
            </div>
          </div>

          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3">Technologies Used</h6>
            <div className="d-flex flex-wrap gap-2">
              {c.technologies.map((t) => (
                <span key={t} className="badge bg-indigo-soft px-3 py-2">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5 mb-4">
          <div className="surface-card p-4">
            <h6 className="fw-semibold mb-3">Course Roadmap</h6>
            <div className="roadmap-track">
              {c.roadmap.map((step, idx) => (
                <React.Fragment key={step}>
                  <div className={`roadmap-node ${idx === c.roadmap.length - 1 ? 'final' : ''}`}>{step}</div>
                  {idx !== c.roadmap.length - 1 && <div className="roadmap-arrow">↓</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
