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

  // ADDED: the amount is now a user-editable field, defaulting to the
  // full pending amount (`amount` prop) but the student can type in a
  // smaller partial-payment figure instead.
  const [enteredAmount, setEnteredAmount] = useState(String(amount))
  const [amountError, setAmountError] = useState(null)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  // ADDED: validation so the entered amount can't be blank, zero,
  // negative, non-numeric, or more than what's actually still owed.
  const validateAmount = (value) => {
    const n = Number(value)
    if (value === '' || Number.isNaN(n)) return 'Enter a valid amount.'
    if (n <= 0) return 'Amount must be greater than ₹0.'
    if (n > amount) return `Amount can't exceed the pending balance of ₹${amount.toLocaleString('en-IN')}.`
    return null
  }

  const handleAmountChange = (e) => {
    const value = e.target.value
    setEnteredAmount(value)
    setAmountError(validateAmount(value))
  }

  const submit = (e) => {
    e.preventDefault()
    const error = validateAmount(enteredAmount)
    if (error) {
      setAmountError(error)
      return
    }
    onPay({ ...form, amount: Number(enteredAmount) })
  }

  const isAmountValid = validateAmount(enteredAmount) === null

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
              {/* ADDED: editable amount field, replacing the fixed display-only amount */}
              <div className="col-md-6">
                <label className="form-label">Amount to Pay (₹)</label>
                <input
                  type="number"
                  className={`form-control ${amountError ? 'is-invalid' : ''}`}
                  value={enteredAmount}
                  onChange={handleAmountChange}
                  min="1"
                  max={amount}
                  step="1"
                  required
                />
                {amountError && <div className="invalid-feedback d-block">{amountError}</div>}
                <div className="form-text">Pending balance: ₹{amount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <div>
                <div className="text-muted small">Amount to Pay</div>
                <div className="fs-4 fw-bold">
                  ₹{(Number(enteredAmount) || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose} disabled={paying}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={paying || !isAmountValid}>
                  {paying && <span className="spinner-border spinner-border-sm me-2"></span>}
                  {paying ? 'Processing...' : `Pay ₹${(Number(enteredAmount) || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}