import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import taskService from '../../services/taskService'

export default function TaskDetails() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: null, task: null })
  const [githubUrl, setGithubUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    setState({ loading: true, error: null, task: null })
    try {
      const task = await taskService.getTaskById(id)
      setState({ loading: false, error: null, task })
    } catch {
      setState({ loading: false, error: 'Unable to load this task.', task: null })
    }
  }

  useEffect(() => { load() }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!githubUrl && !fileName) {
      setFormError('Please upload work or provide a GitHub URL.')
      return
    }
    setFormError('')
    setSubmitting(true)
    const updated = await taskService.submitTask(id, { githubUrl, fileName })
    setState((s) => ({ ...s, task: updated }))
    setSubmitting(false)
  }

  const breadcrumb = ['Student', 'Tasks', state.task?.title || '...']

  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading task..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>
  if (!state.task) return <Layout breadcrumb={breadcrumb}><EmptyState icon="bi-clipboard-x" title="Task not found" /></Layout>

  const t = state.task

  return (
    <Layout breadcrumb={breadcrumb}>
      <Link to="/student/tasks" className="text-decoration-none small text-muted d-inline-flex align-items-center mb-3">
        <i className="bi bi-arrow-left me-1"></i> Back to Tasks
      </Link>

      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="surface-card p-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="font-display fw-bold mb-0">{t.title}</h5>
              <span className="badge bg-indigo-soft">{t.status}</span>
            </div>
            <p className="text-muted">{t.description}</p>
            <div className="row small text-muted">
              <div className="col-6 mb-2"><i className="bi bi-calendar-event me-1"></i>Assigned: {t.assignedDate}</div>
              <div className="col-6 mb-2"><i className="bi bi-calendar-check me-1"></i>Due: {t.dueDate}</div>
              <div className="col-6"><i className="bi bi-mortarboard me-1"></i>{t.course}</div>
            </div>
          </div>
        </div>

        <div className="col-lg-5 mb-4">
          {t.status === 'Pending' ? (
            <div className="surface-card p-4">
              <h6 className="fw-semibold mb-3">Submit Your Work</h6>
              {formError && <div className="alert alert-danger py-2 small">{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Upload Work</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">GitHub URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary-stms w-100" disabled={submitting}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : 'Submit Task'}
                </button>
              </form>
            </div>
          ) : (
            <div className="surface-card p-4">
              <h6 className="fw-semibold mb-3">Submission</h6>
              <div className="mb-2 small"><span className="text-muted">Status: </span><strong>Submitted</strong></div>
              {t.submission?.githubUrl && (
                <div className="mb-2 small text-truncate">
                  <span className="text-muted">GitHub: </span>
                  <a href={t.submission.githubUrl} target="_blank" rel="noreferrer">{t.submission.githubUrl}</a>
                </div>
              )}
              {t.score != null && <div className="mb-2 small"><span className="text-muted">Score: </span><strong>{t.score}/100</strong></div>}
              {t.feedback && (
                <div className="mt-3">
                  <div className="text-muted small mb-1">Trainer Feedback</div>
                  <p className="small mb-0">{t.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
