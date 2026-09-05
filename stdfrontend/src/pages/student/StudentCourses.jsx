import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import CourseCard from '../../components/CourseCard'
import courseService from '../../services/courseService'

export default function StudentCourses() {
  const [state, setState] = useState({ loading: true, error: null, courses: [] })
  const navigate = useNavigate()

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
    <Layout breadcrumb={['Student', 'Courses']}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="font-display fw-bold mb-1">Courses</h4>
          <p className="text-muted mb-0">Explore all available courses at the institute.</p>
        </div>
        <Link to="/student/courses/my-course" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-mortarboard-fill me-1"></i> My Course
        </Link>
      </div>

      {state.loading && <Loading message="Loading courses..." />}
      {state.error && <ErrorMessage message={state.error} onRetry={load} />}
      {!state.loading && !state.error && (
        <div className="row">
          {state.courses.map((c) => (
            <CourseCard
              key={c.id ?? c._id}
              course={c}
              onClick={() => navigate(`/student/courses/${c.id ?? c._id}`)}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}