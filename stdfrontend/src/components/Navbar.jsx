import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onToggleSidebar, breadcrumb }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="stms-topbar">
      <button className="btn btn-light d-lg-none" onClick={onToggleSidebar} aria-label="Toggle menu">
        <i className="bi bi-list fs-5"></i>
      </button>

      <div className="flex-grow-1">
        {breadcrumb && (
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb breadcrumb-bar mb-0">
              {breadcrumb.map((item, idx) => (
                <li
                  key={idx}
                  className={`breadcrumb-item ${idx === breadcrumb.length - 1 ? 'active fw-semibold text-dark' : ''}`}
                >
                  {item}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>

      {user?.role === 'trainer' && (
        <button className="btn btn-primary-stms btn-sm d-none d-md-inline-flex align-items-center gap-1" onClick={() => navigate('/trainer/students/add')}>
          <i className="bi bi-person-plus"></i> Add Student
        </button>
      )}

      <button className="btn btn-light position-relative" onClick={() => navigate(`/${user?.role}/notifications`)} title="Notifications" style={{ display: user?.role === 'student' ? 'inline-flex' : 'none' }}>
        <i className="bi bi-bell"></i>
      </button>

      <div className="d-flex align-items-center gap-2">
        <span className="avatar-circle">{initials}</span>
        <div className="d-none d-md-block">
          <div className="fw-semibold small">{user?.name}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{user?.id}</div>
        </div>
      </div>

      <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-box-arrow-right me-1"></i>Logout</>}
      </button>
    </header>
  )
}
