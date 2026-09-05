import React, { useState } from 'react'

const backdropStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem',
}
const dialogStyle = { width: '100%', maxWidth: 560 }

export default function PaymentModal({ student, amount, onClose, onPay, paying }) {
  const [form, setForm] = useState({
    studentName: student?.name || '',
    course: student?.course || '',
    studentId: student?.studentId || '',
    email: student?.email || '',
    phone: student?.phone || '',
    paymentMethod: 'Card',
  })

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    onPay({ ...form, amount })
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div className="surface-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold mb-0">Pay Course Fees</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={paying}></button>
          </div>

          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Student Name</label>
                <input className="form-control" value={form.studentName} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label">Student ID</label>
                <input className="form-control" value={form.studentId} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label">Course</label>
                <input className="form-control" value={form.course} readOnly />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={update('email')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone No.</label>
                <input type="tel" className="form-control" value={form.phone} onChange={update('phone')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={form.paymentMethod} onChange={update('paymentMethod')}>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Net Banking</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <div>
                <div className="text-muted small">Amount to Pay</div>
                <div className="fs-4 fw-bold">₹{amount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose} disabled={paying}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={paying}>
                  {paying && <span className="spinner-border spinner-border-sm me-2"></span>}
                  {paying ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}