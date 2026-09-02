import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import materialService from '../../services/materialService'
import courseService from '../../services/courseService'

const initialForm = { course: '', title: '', description: '', format: 'pdf' }

// Works whether the course object came from a Mongo-backed API (_id)
// or the mock courseService (id) — avoids the select/value mismatch.
const getCourseId = (c) => (c ? c._id || c.id : undefined)

// Some backends return the stored file location under a different key
// than fileUrl — check the common alternatives so the View button
// doesn't stay disabled just because of a naming mismatch.
const getFileUrl = (m) => m?.fileUrl || m?.url || m?.filePath || m?.path || null

export default function TrainerMaterials() {
  const [state, setState] = useState({ loading: true, error: null, materials: [] })
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const load = async () => {
    setState({ loading: true, error: null, materials: [] })
    try {
      const [materials, courseList] = await Promise.all([
        materialService.getAllMaterials(),
        courseService.getAllCourses(),
      ])
      setState({ loading: false, error: null, materials: Array.isArray(materials) ? materials : [] })
      setCourses(Array.isArray(courseList) ? courseList : [])
    } catch {
      setState({ loading: false, error: 'Unable to load materials.', materials: [] })
    }
  }

  useEffect(() => { load() }, [])

  const courseName = (course) => {
    if (course && typeof course === 'object') return course.name
    return courses.find((c) => getCourseId(c) === course)?.name || course
  }

  const validate = () => {
    const next = {}
    if (!form.course) next.course = 'Please select a course.'
    if (!form.title.trim()) next.title = 'Material title is required.'
    if (!selectedFile) next.file = 'Please choose a file.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const acceptFor = (format) => {
    if (format === 'pdf') return 'application/pdf'
    if (format === 'video') return 'video/*'
    return 'image/*'
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setUploadError('')
    if (!validate()) return

    setUploading(true)
    try {
      const material = await materialService.uploadMaterial({
        courseId: form.course,
        title: form.title,
        description: form.description,
        format: form.format,
        file: selectedFile,
      })
      setState((s) => ({ ...s, materials: [material, ...s.materials] }))
      setShowForm(false)
      setForm(initialForm)
      setSelectedFile(null)
      setErrors({})
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Failed to upload material. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await materialService.deleteMaterial(id)
      setState((s) => ({ ...s, materials: s.materials.filter((m) => (m._id || m.id) !== id) }))
    } catch {
      setState((s) => ({ ...s, error: 'Failed to delete material.' }))
    }
  }

  const handleView = (material) => {
    const url = materialService.resolveFileUrl(getFileUrl(material))
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const materials = Array.isArray(state.materials) ? state.materials : []

  const breadcrumb = ['Trainer', 'Materials']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading materials..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="font-display fw-bold mb-0">Materials</h4>
        <button className="btn btn-primary-stms btn-sm" onClick={() => setShowForm((f) => !f)}>
          <i className="bi bi-upload me-1"></i> Upload Material
        </button>
      </div>

      {showForm && (
        <div className="surface-card p-4 mb-4">
          <h6 className="fw-semibold mb-3">Add Material</h6>
          {uploadError && <div className="alert alert-danger py-2 small">{uploadError}</div>}
          <form onSubmit={handleUpload}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Course</label>
                <select className={`form-select ${errors.course ? 'is-invalid' : ''}`} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                  <option value="">Select course</option>
                  {courses.map((c) => {
                    const cid = getCourseId(c)
                    return <option key={cid} value={cid}>{c.name}</option>
                  })}
                </select>
                {errors.course && <div className="invalid-feedback">{errors.course}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Material Title</label>
                <input className={`form-control ${errors.title ? 'is-invalid' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>
              <div className="col-12 mb-3">
                <label className="form-label small fw-semibold">Description</label>
                <textarea className="form-control" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold d-block">Format</label>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" checked={form.format === 'pdf'} onChange={() => setForm({ ...form, format: 'pdf' })} id="fmtPdf" />
                  <label className="form-check-label" htmlFor="fmtPdf">PDF</label>
                </div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" checked={form.format === 'video'} onChange={() => setForm({ ...form, format: 'video' })} id="fmtVideo" />
                  <label className="form-check-label" htmlFor="fmtVideo">Video</label>
                </div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" checked={form.format === 'image'} onChange={() => setForm({ ...form, format: 'image' })} id="fmtImage" />
                  <label className="form-check-label" htmlFor="fmtImage">Image</label>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Choose File</label>
                <input
                  type="file"
                  accept={acceptFor(form.format)}
                  className={`form-control ${errors.file ? 'is-invalid' : ''}`}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                {selectedFile && <div className="form-text">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</div>}
              </div>
            </div>
            <button className="btn btn-primary-stms" disabled={uploading}>
              {uploading ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</> : 'Upload Material'}
            </button>
          </form>
        </div>
      )}

      {materials.length === 0 ? (
        <EmptyState icon="bi-folder2-open" title="No materials uploaded yet" />
      ) : (
        <div className="surface-card">
          <div className="table-responsive">
            <table className="table table-stms align-middle mb-0">
              <thead><tr><th>Material Title</th><th>Course</th><th>Format</th><th>Uploaded Date</th><th>Actions</th></tr></thead>
              <tbody>
                {materials.map((m) => {
                  const fileUrl = getFileUrl(m)
                  return (
                    <tr key={m._id || m.id}>
                      <td className="fw-semibold">{m.title}</td>
                      <td>{courseName(m.courseId)}</td>
                      <td>
                        <span className={`badge ${m.type === 'PDF' ? 'bg-coral-soft' : m.type === 'VIDEO' ? 'bg-indigo-soft' : 'bg-warning-soft'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td>{new Date(m.uploadedDate || m.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleView(m)}
                            disabled={!fileUrl}
                            title={fileUrl ? 'Open file' : 'No file available'}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m._id || m.id)}><i className="bi bi-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}