import React from 'react'

export default function Loading({ message = 'Loading...', fullPage = false, small = false }) {
  if (small) {
    return (
      <span className="spinner-border spinner-border-sm text-light me-2" role="status" aria-hidden="true" />
    )
  }
  return (
    <div
      className={fullPage ? 'd-flex flex-column align-items-center justify-content-center' : 'text-center py-5'}
      style={fullPage ? { minHeight: '100vh' } : undefined}
    >
      <div className="spinner-border text-indigo" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted">{message}</p>
    </div>
  )
}
