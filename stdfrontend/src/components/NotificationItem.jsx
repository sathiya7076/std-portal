import React from 'react'

export default function NotificationItem({ notification, onMarkRead }) {
  return (
    <div className={`d-flex align-items-start gap-3 p-3 border-bottom ${!notification.read ? 'bg-indigo-100' : ''}`} style={!notification.read ? { background: '#f5f6ff' } : undefined}>
      <span className="stat-icon bg-indigo-soft" style={{ width: 36, height: 36, fontSize: '1rem' }}>
        <i className={`bi ${notification.icon}`}></i>
      </span>
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between">
          <span className="fw-semibold small">{notification.title}</span>
          {!notification.read && <span className="badge bg-indigo-soft">New</span>}
        </div>
        <p className="text-muted small mb-1">{notification.message}</p>
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>{notification.date}</span>
      </div>
      {!notification.read && (
        <button className="btn btn-sm btn-link" onClick={() => onMarkRead(notification.id)}>
          Mark as Read
        </button>
      )}
    </div>
  )
}
