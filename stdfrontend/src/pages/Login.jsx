import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [role, setRole] = useState('student')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const next = {}
    if (!id.trim()) next.id = 'Email is required.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login({ role, id, password, rememberMe })
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-4">
          <span className="brand-mark d-inline-flex mb-3" style={{ width: 46, height: 46, fontSize: '1.2rem' }}>S</span>
          <h4 className="font-display fw-bold mb-1">Smart Training Management System</h4>
          <p className="text-muted small mb-0">Sign in to continue to your dashboard</p>
        </div>

        <div className="role-toggle mb-4">
          <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>
            <i className="bi bi-mortarboard me-1"></i> Student Login
          </button>
          <button type="button" className={role === 'trainer' ? 'active' : ''} onClick={() => setRole('trainer')}>
            <i className="bi bi-person-workspace me-1"></i> Trainer Login
          </button>
        </div>

        {serverError && (
          <div className="alert alert-danger py-2 small" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input
              type="text"
              className={`form-control ${errors.id ? 'is-invalid' : ''}`}
              placeholder="you@example.com"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
            {errors.id && <div className="invalid-feedback">{errors.id}</div>}
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

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="rememberMe">Remember Me</label>
            </div>
            <a href="#!" className="small text-decoration-none">Forgot Password?</a>
          </div>

          <button type="submit" className="btn btn-primary-stms w-100 py-2" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account? <Link to="/register" className="text-decoration-none fw-semibold">Register</Link>
        </p>
      </div>
    </div>
  )
}