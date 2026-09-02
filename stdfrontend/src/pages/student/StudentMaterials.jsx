import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import courseService from '../../services/courseService'

export default function StudentMaterials() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: null, courses: [] })

  const load = async () => {
    setState({ loading: true, error: null, courses: [] })
    try {
      const courses = await courseService.getAllCourses()
      setState({ loading: false, error: null, courses })
    } catch {
      setState({ loading: false, error: 'Unable to load courses.', courses: [] })
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Layout breadcrumb={['Student', 'Study Materials']}>
      <h4 className="font-display fw-bold mb-1">Study Materials</h4>
      <p className="text-muted mb-4">Select a course to browse its PDF and video materials.</p>

      {state.loading && <Loading message="Loading courses..." />}
      {state.error && <ErrorMessage message={state.error} onRetry={load} />}
      {!state.loading && !state.error && (
        <div className="row">
          {state.courses.map((c) => (
            <div className="col-md-6 col-xl-3 mb-4" key={c.id}>
              <div
                className="surface-card p-4 h-100 cursor-pointer"
                onClick={() => navigate(`/student/materials/${c.id}`)}
              >
                <span className="stat-icon bg-indigo-soft mb-3"><i className={`bi ${c.icon}`}></i></span>
                <h6 className="fw-semibold">{c.name}</h6>
                <span className="text-indigo small">Browse Materials <i className="bi bi-arrow-right"></i></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
