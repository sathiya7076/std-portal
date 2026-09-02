import React from 'react'
import { Link } from 'react-router-dom'

export default function StudentCard({ student }) {
  const initials = student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="col-sm-6 col-lg-4 mb-4">
      <div className="surface-card p-3 h-100">
        <div className="d-flex align-items-center gap-3 mb-3">
          <span className="avatar-circle" style={{ width: 46, height: 46, fontSize: '1rem' }}>{initials}</span>
          <div>
            <div className="fw-semibold">{student.name}</div>
            <div className="text-muted small">{student.id} • {student.course}</div>
          </div>
        </div>
        <div className="d-flex justify-content-between small text-muted mb-1">
          <span>Attendance</span><span className="fw-semibold text-dark">{student.attendance}%</span>
        </div>
        <div className="d-flex justify-content-between small text-muted mb-3">
          <span>Progress</span><span className="fw-semibold text-dark">{student.progress}%</span>
        </div>
        <Link to={`/trainer/students/${student.id}`} className="btn btn-outline-secondary btn-sm w-100">
          View Profile
        </Link>
      </div>
    </div>
  )
}
