import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import MaterialCard from '../../components/MaterialCard'
import courseService from '../../services/courseService'
import materialService from '../../services/materialService'

export default function MaterialsByCourse() {
  const { courseId } = useParams()
  const [state, setState] = useState({ loading: true, error: null, course: null, materials: [] })

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [course, materials] = await Promise.all([
        courseService.getCourseById(courseId),
        materialService.getMaterialsByCourse(courseId),
      ])
      setState({ loading: false, error: null, course, materials })
    } catch {
      setState({ loading: false, error: 'Unable to load materials.', course: null, materials: [] })
    }
  }

  useEffect(() => { load() }, [courseId])

  const breadcrumb = ['Student', 'Study Materials', state.course?.name || '...']
  const pdfMaterials = state.materials.filter((m) => m.format === 'pdf')
  const videoMaterials = state.materials.filter((m) => m.format === 'video')

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading materials..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  return (
    <Layout breadcrumb={breadcrumb}>
      <Link to="/student/materials" className="text-decoration-none small text-muted d-inline-flex align-items-center mb-3">
        <i className="bi bi-arrow-left me-1"></i> Back to Study Materials
      </Link>
      <h4 className="font-display fw-bold mb-4">{state.course?.name}</h4>

      {state.materials.length === 0 ? (
        <EmptyState icon="bi-folder2-open" title="No materials yet" message="Check back soon — your trainer hasn't uploaded materials for this course." />
      ) : (
        <>
          <h6 className="fw-semibold mb-3"><i className="bi bi-file-earmark-pdf text-danger me-2"></i>PDF Materials</h6>
          {pdfMaterials.length === 0 ? (
            <p className="text-muted small mb-4">No PDF materials yet.</p>
          ) : (
            <div className="row mb-3">{pdfMaterials.map((m) => <MaterialCard key={m.id} material={m} />)}</div>
          )}

          <h6 className="fw-semibold mb-3 mt-4"><i className="bi bi-play-btn text-indigo me-2"></i>Video Materials</h6>
          {videoMaterials.length === 0 ? (
            <p className="text-muted small">No video materials yet.</p>
          ) : (
            <div className="row">{videoMaterials.map((m) => <MaterialCard key={m.id} material={m} />)}</div>
          )}
        </>
      )}
    </Layout>
  )
}
