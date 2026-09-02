import React from 'react'
import { Link } from 'react-router-dom'

const statusVariant = {
  Pending: 'bg-amber-soft',
  Submitted: 'bg-indigo-soft',
  Completed: 'bg-teal-soft',
}

export default function TaskCard({ task, basePath = '/student/tasks' }) {
  return (
    <div className="col-md-6 col-xl-4 mb-4">
      <div className="surface-card p-4 h-100 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="fw-semibold mb-0">{task.title}</h6>
          <span className={`badge rounded-pill ${statusVariant[task.status] || 'bg-secondary'}`}>{task.status}</span>
        </div>
        <p className="text-muted small flex-grow-1">{task.description}</p>
        <div className="small text-muted mb-1"><i className="bi bi-calendar-event me-1"></i>Assigned: {task.assignedDate}</div>
        <div className="small text-muted mb-3"><i className="bi bi-calendar-check me-1"></i>Due: {task.dueDate}</div>
        {task.score != null && (
          <div className="small mb-2"><span className="text-muted">Score: </span><strong>{task.score}/100</strong></div>
        )}
        <Link to={`${basePath}/${task.id}`} className="btn btn-outline-secondary btn-sm w-100">
          {task.status === 'Pending' ? 'Submit Task' : 'View Details'}
        </Link>
      </div>
    </div>
  )
}
