import React from 'react'
import materialService from '../services/materialService'

// FIXED: backend returns `type` ("PDF" | "VIDEO" | "IMAGE") and `fileUrl`, but this
// card checked `material.format === 'pdf'` (never true) and the buttons had no
// click handlers, so students could see materials but never open them.
export default function MaterialCard({ material }) {
  const type = String(material.type || material.format || '').toUpperCase()
  const isPdf = type === 'PDF'
  const isVideo = type === 'VIDEO'
  const url = materialService.resolveFileUrl(material.fileUrl || material.url)
  const dateValue = material.uploadedDate || material.createdAt
  const dateText = dateValue ? new Date(dateValue).toLocaleDateString() : ''

  const open = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="col-sm-6 col-lg-4 mb-3">
      <div className="surface-card p-3 h-100 d-flex align-items-center gap-3">
        <span className={`stat-icon ${isPdf ? 'bg-coral-soft' : 'bg-indigo-soft'}`}>
          <i className={`bi ${isPdf ? 'bi-file-earmark-pdf' : isVideo ? 'bi-play-btn' : 'bi-image'}`}></i>
        </span>
        <div className="flex-grow-1">
          <div className="fw-semibold small">{material.title}</div>
          {dateText && (
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Uploaded {dateText}</div>
          )}
        </div>
        <div className="d-flex flex-column gap-1">
          <button className="btn btn-sm btn-outline-secondary py-0" onClick={open} disabled={!url}>
            {isVideo ? 'Watch' : 'View'}
          </button>
          {!isVideo && url && (
            <a className="btn btn-sm btn-outline-secondary py-0" href={url} download target="_blank" rel="noopener noreferrer">
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}