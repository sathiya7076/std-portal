import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import materialService from '../../services/materialService'

export default function MaterialsByCourse() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: null, materials: [] })

  const load = async () => {
    setState({ loading: true, error: null, materials: [] })
    // ADDED: debug — confirm the route param is actually reaching this component
    console.log('[DEBUG] useParams courseId:', courseId)
    try {
      const materials = await materialService.getMaterialsByCourse(courseId)
      // ADDED: debug — see the raw response before any filtering/defaulting
      console.log('[DEBUG] raw materials response:', materials)
      if (Array.isArray(materials) && materials.length > 0) {
        console.log('[DEBUG] first material object:', materials[0])
      }
      setState({ loading: false, error: null, materials: Array.isArray(materials) ? materials : [] })
    } catch (err) {
      // ADDED: debug — surface the actual backend response instead of just the generic message
      console.error('[DEBUG] Failed to load study materials:', {
        status: err?.response?.status,
        body: err?.response?.data,
        message: err?.message,
      })
      setState({ loading: false, error: 'Unable to load study materials.', materials: [] })
    }
  }

  useEffect(() => { load() }, [courseId])

  const openMaterial = (material) => {
    // ADDED: debug — confirm the exact field name / value used to build the file URL
    console.log('[DEBUG] material clicked:', material)
    const url = materialService.resolveFileUrl(material.fileUrl)
    console.log('[DEBUG] resolved file url:', url)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      // ADDED: debug — this was previously silent; now it's visible when a click does nothing
      console.warn('[DEBUG] No URL resolved for material — check the field name materialService expects (fileUrl vs url vs filePath, etc).')
    }
  }

  return (
    <Layout breadcrumb={['Student', 'Study Materials', 'Course']}>
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-sm btn-link text-decoration-none ps-0" onClick={() => navigate('/student/materials')}>
          <i className="bi bi-arrow-left me-1"></i>Back to Courses
        </button>
      </div>

      <h4 className="font-display fw-bold mb-1">Study Materials</h4>
      <p className="text-muted mb-4">Click a material below to open it.</p>

      {state.loading && <Loading message="Loading materials..." />}
      {state.error && <ErrorMessage message={state.error} onRetry={load} />}

      {!state.loading && !state.error && state.materials.length === 0 && (
        <div className="surface-card p-4 text-center text-muted">
          No study materials have been uploaded for this course yet.
        </div>
      )}

      {!state.loading && !state.error && state.materials.length > 0 && (
        <div className="row">
          {state.materials.map((m) => {
            const isVideo = String(m.type).toUpperCase() === 'VIDEO'
            return (
              <div className="col-md-6 col-xl-4 mb-4" key={m._id || m.id}>
                <div
                  className="surface-card p-4 h-100 cursor-pointer"
                  onClick={() => openMaterial(m)}
                >
                  <span className={`stat-icon mb-3 ${isVideo ? 'bg-coral-soft' : 'bg-indigo-soft'}`}>
                    <i className={`bi ${isVideo ? 'bi-play-circle' : 'bi-file-earmark-pdf'}`}></i>
                  </span>
                  <h6 className="fw-semibold mb-1">{m.title}</h6>
                  {m.description && <p className="text-muted small mb-1">{m.description}</p>}
                  <span className="text-muted small text-uppercase">{m.type}</span>
                  <div className="mt-2">
                    <span className="text-indigo small">
                      Open {isVideo ? 'Video' : 'PDF'} <i className="bi bi-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}