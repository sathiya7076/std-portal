import React from 'react'

export default function MaterialCard({ material }) {
  const isPdf = material.format === 'pdf'
  return (
    <div className="col-sm-6 col-lg-4 mb-3">
      <div className="surface-card p-3 h-100 d-flex align-items-center gap-3">
        <span className={`stat-icon ${isPdf ? 'bg-coral-soft' : 'bg-indigo-soft'}`}>
          <i className={`bi ${isPdf ? 'bi-file-earmark-pdf' : 'bi-play-btn'}`}></i>
        </span>
        <div className="flex-grow-1">
          <div className="fw-semibold small">{material.title}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>Uploaded {material.uploadedDate}</div>
        </div>
        <div className="d-flex flex-column gap-1">
          {isPdf ? (
            <>
              <button className="btn btn-sm btn-outline-secondary py-0">View</button>
              <button className="btn btn-sm btn-outline-secondary py-0">Download</button>
            </>
          ) : (
            <button className="btn btn-sm btn-outline-secondary py-0">Watch</button>
          )}
        </div>
      </div>
    </div>
  )
}
