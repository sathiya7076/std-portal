import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../services/authService'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  // ADDED: trainer accounts now need admin approval, so after a successful
  // registration we show a "pending approval" screen instead of logging in.
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const next = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      // CHANGED: was `useAuth().register(...)` followed by
      // navigate(`/${user.role}/dashboard`). The backend no longer returns a
      // token for trainers (they are "pending" until an admin approves), so
      // auto-login after register would break. authService.register is the
      // same call AddStudent.jsx already uses and does not log anyone in.
      await authService.register({ name, email, password, role: 'trainer', phone })
      setSubmitted(true)
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ADDED: pending-approval screen
  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-card text-center">
          <span className="brand-mark d-inline-flex mb-3" style={{ width: 46, height: 46, fontSize: '1.2rem' }}>S</span>
          <h4 className="font-display fw-bold mb-2">Registration submitted</h4>
          <div className="alert alert-success py-2 small text-start" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            Your trainer account has been created and is <strong>waiting for admin approval</strong>.
            You can log in once an admin approves your request.
          </div>
          <Link to="/login" className="btn btn-primary-stms w-100 py-2">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-4">
          <span className="brand-mark d-inline-flex mb-3" style={{ width: 46, height: 46, fontSize: '1.2rem' }}>S</span>
          <h4 className="font-display fw-bold mb-1">Create your trainer account</h4>
          <p className="text-muted small mb-0">Sign up to get started (admin approval required)</p>
        </div>

        {serverError && (
          <div className="alert alert-danger py-2 small" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Full Name</label>
            <input
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Phone (optional)</label>
            <input
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Confirm Password</label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>

          <button type="submit" className="btn btn-primary-stms w-100 py-2" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Creating account...</>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Already have an account? <Link to="/login" className="text-decoration-none fw-semibold">Login</Link>
        </p>
      </div>
    </div>
  )
}