import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'
import studentService from '../../services/studentService'
import { mockCourses } from '../../mock/mockData'

const PAGE_SIZE = 5

export default function TrainerStudents() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: null, students: [] })
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)

  const load = async () => {
    setState({ loading: true, error: null, students: [] })
    try {
      const students = await studentService.getAllStudents({ search, course, sortBy })
      setState({ loading: false, error: null, students })
    } catch {
      setState({ loading: false, error: 'Unable to load students.', students: [] })
    }
  }

  useEffect(() => { load() }, [search, course, sortBy])
  useEffect(() => { setPage(1) }, [search, course, sortBy])

  const handleDelete = async () => {
    try {
      // FIXED: use _id (real Mongo ID), not studentId (display code) —
      // DELETE /students/:id needs the real document ID.
      await studentService.deleteStudent(toDelete._id)
      setState((s) => ({ ...s, students: s.students.filter((st) => st._id !== toDelete._id) }))
    } catch (err) {
      if (err.response?.status === 404) {
        // ADDED: backend had no document with this _id — most likely the
        // rendered list was stale (already deleted elsewhere, or a
        // duplicate click). Drop it locally instead of surfacing an error.
        console.warn('[DEBUG] Student already deleted (stale list), removing locally:', toDelete._id)
        setState((s) => ({ ...s, students: s.students.filter((st) => st._id !== toDelete._id) }))
      } else {
        // ADDED: log the real backend response for anything else so
        // future failures aren't silent/uncaught.
        console.error('[DEBUG] deleteStudent failed:', {
          id: toDelete._id,
          status: err.response?.status,
          body: err.response?.data,
        })
        setState((s) => ({ ...s, error: 'Failed to delete student. Please refresh and try again.' }))
      }
    } finally {
      setToDelete(null)
    }
  }

  const breadcrumb = ['Trainer', 'Students']
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const totalPages = Math.max(1, Math.ceil(state.students.length / PAGE_SIZE))
  const paginated = state.students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="font-display fw-bold mb-0">Students</h4>
        <Link to="/trainer/students/add" className="btn btn-primary-stms btn-sm">
          <i className="bi bi-person-plus me-1"></i> Add Student
        </Link>
      </div>

      <div className="surface-card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select className="form-select" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All Courses</option>
              {mockCourses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="attendance">Sort by Attendance</option>
              <option value="progress">Sort by Progress</option>
            </select>
          </div>
        </div>
      </div>

      {state.loading ? (
        <Loading message="Loading students..." />
      ) : state.students.length === 0 ? (
        <EmptyState icon="bi-people" title="No students found" message="Try adjusting your search or filters." />
      ) : (
        <div className="surface-card">
          <div className="table-responsive">
            <table className="table table-stms align-middle mb-0">
              <thead>
                <tr>
                  <th>Student ID</th><th>Student Name</th><th>Course</th><th>Attendance</th><th>Learning Progress</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s._id}>
                    {/* FIXED: display studentId (human-readable, e.g. "STU-LX7K9F"), not _id */}
                    <td className="text-muted">{s.studentId}</td>
                    <td className="fw-semibold">{s.name}</td>
                    <td>{s.course}</td>
                    <td>{s.attendance}%</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="stms-progress"><div style={{ width: `${s.progress}%` }}></div></div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {/* FIXED: navigate using _id (real Mongo ID) — GET /students/:id needs this, not the display code */}
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/trainer/students/${s._id}`)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setToDelete(s)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted small">Page {page} of {totalPages}</span>
            <div className="btn-group">
              <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!toDelete}
        title="Delete Student"
        message={`Are you sure you want to remove ${toDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Layout>
  )
}