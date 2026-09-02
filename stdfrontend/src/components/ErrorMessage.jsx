import React from 'react'

export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="error-state">
      <i className="bi bi-exclamation-triangle"></i>
      <h5 className="fw-semibold mb-1">{title}</h5>
      <p className="mb-3">{message || 'Please try again in a moment.'}</p>
      {onRetry && (
        <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1"></i> Retry
        </button>
      )}
    </div>
  )
}
