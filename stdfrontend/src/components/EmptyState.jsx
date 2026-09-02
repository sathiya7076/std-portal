import React from 'react'

export default function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`}></i>
      <h5 className="fw-semibold mb-1">{title}</h5>
      {message && <p className="mb-3">{message}</p>}
      {action}
    </div>
  )
}
