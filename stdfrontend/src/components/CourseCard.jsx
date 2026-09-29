import React from 'react'
import { getImageUrl, PLACEHOLDER_IMAGE } from '../services/imageurl'

export default function CourseCard({ course, onClick }) {
  if (!course) return null

  const technologies = Array.isArray(course.technologies)
    ? course.technologies
    : []

  return (
    <div className="col-12 col-sm-6 col-lg-4 mb-4">
      <div
        className="card h-100 shadow-sm"
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <img
          src={getImageUrl(course.image)}
          alt={course.name}
          className="card-img-top"
          loading="lazy"
          style={{ width: '100%', height: 180, objectFit: 'cover' }}
          onError={(e) => {
            e.currentTarget.onerror = null // avoid infinite loop
            e.currentTarget.src = PLACEHOLDER_IMAGE
          }}
        />

        <div className="card-body d-flex flex-column">
          <h5 className="card-title fw-bold mb-1">{course.name}</h5>
          {course.code && (
            <small className="text-muted mb-2">Code: {course.code}</small>
          )}

          {course.description && (
            <p className="card-text text-muted small">
              {course.description.length > 100
                ? course.description.slice(0, 100) + '...'
                : course.description}
            </p>
          )}

          {technologies.length > 0 && (
            <div className="mb-2">
              {technologies.map((t) => (
                <span key={t} className="badge bg-light text-dark border me-1">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              <i className="bi bi-clock me-1"></i>
              {course.duration}
            </span>
            <span className="fw-bold">₹{course.fees}</span>
          </div>
        </div>
      </div>
    </div>
  )
}