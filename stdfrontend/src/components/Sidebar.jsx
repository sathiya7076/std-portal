import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const studentLinks = [
  { to: '/student/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
  { to: '/student/register', icon: 'bi-fingerprint', label: 'Student Register' },
  { to: '/student/courses', icon: 'bi-mortarboard', label: 'Courses' },
  { to: '/student/materials', icon: 'bi-folder2-open', label: 'Study Materials' },
  { to: '/student/tasks', icon: 'bi-clipboard-check', label: 'Tasks' },
  { to: '/student/fees', icon: 'bi-cash-coin', label: 'Fees' },
  { to: '/student/profile', icon: 'bi-person-circle', label: 'Student Profile' },
  { to: '/student/notifications', icon: 'bi-bell', label: 'Notifications' },
]

const trainerLinks = [
  { to: '/trainer/dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
  { to: '/trainer/students', icon: 'bi-people', label: 'Students' },
  { to: '/trainer/courses', icon: 'bi-mortarboard', label: 'Courses' },
  { to: '/trainer/tasks', icon: 'bi-clipboard-check', label: 'Tasks' },
  { to: '/trainer/materials', icon: 'bi-folder2-open', label: 'Materials' },
  { to: '/trainer/profile', icon: 'bi-person-circle', label: 'Trainer Profile' },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const links = user?.role === 'trainer' ? trainerLinks : studentLinks

  return (
    <>
      {open && <div className="sidebar-backdrop d-lg-none" onClick={onClose}></div>}
      <aside className={`stms-sidebar ${open ? 'open' : ''}`}>
        <div className="brand d-flex align-items-center gap-2">
          <span className="brand-mark">S</span>
          <div>
            <div className="brand-title">Smart Training</div>
            <div className="brand-sub">Management System</div>
          </div>
        </div>
        <nav className="stms-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${link.icon}`}></i>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="stms-sidebar-footer">
          Logged in as <strong className="text-light">{user?.role === 'trainer' ? 'Trainer' : 'Student'}</strong>
        </div>
      </aside>
    </>
  )
}
