import React from 'react'

export default function ProgressBar({ label, percent = 0, showValue = true }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="mb-2">
      {(label || showValue) && (
        <div className="d-flex justify-content-between mb-1">
          {label && <span className="small fw-medium">{label}</span>}
          {showValue && <span className="small text-muted">{clamped}%</span>}
        </div>
      )}
      <div className="stms-progress">
        <div style={{ width: `${clamped}%` }}></div>
      </div>
    </div>
  )
}
