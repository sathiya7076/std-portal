import React from 'react'
import { Link } from 'react-router-dom'

// Server base URL derived from the same env var api.js uses (strips trailing /api)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SERVER_BASE = API_URL.replace(/\/api\/?$/, '')

// Supports relative paths (/uploads/x.jpg) and full URLs (Cloudinary etc.)
const getImageUrl = (img) => {
  if (!img) return ''
  if (/^(https?:|blob:|data:)/.test(img)) return img
  return `${SERVER_BASE}${img.startsWith('/') ? '' : '/'}${img}`
}

export default function CourseCard({ course }) {
  return (
    <div className="col-md-6 col-xl-4 mb-4">
      <div className="surface-card p-4 h-100 d-flex flex-column">
        {course.image && (
          <div className="mb-3">
            <img
              src={getImageUrl(course.image)}
              alt={course.name}
              loading="lazy"
              className="w-100 rounded course-card-img"
              style={{ height: '160px', objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="d-flex align-items-start justify-content-between mb-3">
          <span className="stat-icon bg-indigo-soft">
            <i className={`bi ${course.icon || 'bi-mortarboard'}`}></i>
          </span>
          {course.status && (
            <span className={`badge rounded-pill ${course.status === 'New' ? 'bg-teal-soft text-teal' : 'bg-indigo-soft'}`}>
              {course.status}
            </span>
          )}
        </div>

        {course.code && (
          <span className="badge bg-secondary-soft text-secondary mb-1 align-self-start">
            {course.code}
          </span>
        )}

        <h5 className="fw-semibold mb-1">{course.name}</h5>
        <p className="text-muted small flex-grow-1">{course.description}</p>
        <div className="d-flex justify-content-between small text-muted mb-3">
          <span><i className="bi bi-clock me-1"></i>{course.duration}</span>
          {course.fees && (
            <span>
              <i className="bi bi-currency-rupee me-1"></i>
              {course.fees.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <Link to={`/student/courses/${course.id}`} className="btn btn-primary-stms btn-sm w-100">
          View Details
        </Link>
      </div>
    </div>
  )
}