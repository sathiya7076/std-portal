import React from 'react'

export default function ConfirmModal({
  show,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!show) return null
  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 14 }}>
            <div className="modal-header border-0">
              <h5 className="modal-title font-display">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel}></button>
            </div>
            <div className="modal-body text-secondary">{message}</div>
            <div className="modal-footer border-0">
              <button className="btn btn-light" onClick={onCancel}>{cancelLabel}</button>
              <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  )
}
