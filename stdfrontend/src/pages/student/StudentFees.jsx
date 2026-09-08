import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import PaymentModal from './Paymentmodel'
import feeService from '../../services/feeService'
import studentService from '../../services/studentService' // ADDED: needed to know the student's own course

// ADDED: safe formatter so a null/undefined/non-numeric fee value can't
// throw ".toLocaleString is not a function" and crash the page.
const formatINR = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0'
}

export default function StudentFees() {
  const [state, setState] = useState({ loading: true, error: null, fees: null })
  const [downloadingId, setDownloadingId] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [justPaidReceiptId, setJustPaidReceiptId] = useState(null)
  // ADDED: surface download failures instead of leaving the spinner stuck forever
  const [downloadError, setDownloadError] = useState(null)
  // ADDED: cache the student's own studentId/course so payFees can pass them along too
  const [studentInfo, setStudentInfo] = useState({ studentId: null, course: null })

  const load = async () => {
    setState({ loading: true, error: null, fees: null })
    try {
      // ADDED: fetch the logged-in student's own profile first, so fees
      // are looked up (and, if new, seeded) against their real course
      // instead of an unrelated shared/global fee record.
      const profile = await studentService.getProfile()
      const info = { studentId: profile?.studentId, course: profile?.course }
      setStudentInfo(info)

      const fees = await feeService.getMyFees(info)
      setState({ loading: false, error: null, fees })
    } catch {
      setState({ loading: false, error: 'Unable to load fee details.', fees: null })
    }
  }

  useEffect(() => { load() }, [])

  const handleDownload = async (receiptId) => {
    setDownloadingId(receiptId)
    setDownloadError(null)
    try {
      // FIXED: no try/finally previously meant a thrown error here left
      // setDownloadingId stuck forever, permanently disabling the button
      // with no way to retry short of a full page reload.
      await feeService.downloadReceipt(receiptId)
    } catch (err) {
      console.error('Download receipt failed:', err?.response?.data || err.message)
      setDownloadError('Could not download the receipt. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePay = async (payload) => {
    setPaying(true)
    setPaymentError(null)
    try {
      // ADDED: attach studentId/course so the payment lands on this
      // student's own fee record instead of the shared legacy one.
      const result = await feeService.payFees({ ...payload, ...studentInfo })
      setShowPaymentModal(false)
      setJustPaidReceiptId(result.receiptId)
      await load() // refresh totals + history so the new payment shows up
    } catch {
      setPaymentError('Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const breadcrumb = ['Student', 'Fees']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading fee details..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const f = state.fees

  // ADDED: safe array so f.history.map never crashes if a fee record
  // has no history yet (e.g. a brand-new student with no payments).
  const paymentHistory = Array.isArray(f.history) ? f.history : []

  // ADDED: explicit numeric coercion so a stringy pendingAmount from the
  // API can't misbehave in the ">" comparisons below.
  const pendingAmountNum = Number(f.pendingAmount) || 0

  const statusBadge = f.status === 'Paid' ? 'bg-teal-soft' : f.status === 'Partially Paid' ? 'bg-amber-soft' : 'bg-coral-soft'

  // Student identity used to prefill the payment form.
  // Swap this for real logged-in student data (e.g. an auth/profile service) when wiring to the backend.
  const student = {
    name: f.studentName || 'Student Name',
    course: f.course || 'Course Name',
    studentId: f.studentId || 'N/A',
    email: f.email || '',
    phone: f.phone || '',
  }

  return (
    <Layout breadcrumb={breadcrumb}>
      <h4 className="font-display fw-bold mb-4">Fees</h4>

      {justPaidReceiptId && (
        <div className="alert alert-success d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <i className="bi bi-check-circle-fill me-2"></i>
            Payment successful! Your receipt is ready to download.
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleDownload(justPaidReceiptId)}
              disabled={downloadingId === justPaidReceiptId}
            >
              {downloadingId === justPaidReceiptId
                ? <span className="spinner-border spinner-border-sm"></span>
                : <><i className="bi bi-download me-1"></i>Download Receipt</>}
            </button>
            <button
              type="button"
              className="btn-close"
              aria-label="Dismiss"
              onClick={() => setJustPaidReceiptId(null)}
            ></button>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="alert alert-danger mb-4" role="alert">{paymentError}</div>
      )}

      {downloadError && (
        <div className="alert alert-danger mb-4" role="alert">{downloadError}</div>
      )}

      <div className="row mb-2">
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className="stat-icon bg-indigo-soft"><i className="bi bi-receipt"></i></span>
            <div className="stat-value">₹{formatINR(f.totalFees)}</div>
            <div className="stat-label">Course Total Fees</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className="stat-icon bg-teal-soft"><i className="bi bi-cash-stack"></i></span>
            <div className="stat-value">₹{formatINR(f.paidAmount)}</div>
            <div className="stat-label">Paid Amount</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className="stat-icon bg-coral-soft"><i className="bi bi-exclamation-circle"></i></span>
            <div className="stat-value">₹{formatINR(f.pendingAmount)}</div>
            <div className="stat-label">Pending Amount</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className={`badge rounded-pill ${statusBadge} mb-2`}>{f.status}</span>
            <div className="stat-label">Payment Status</div>
            {pendingAmountNum > 0 && (
              <button className="btn btn-sm btn-primary mt-2" onClick={() => setShowPaymentModal(true)}>
                <i className="bi bi-credit-card me-1"></i>Pay Now
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card p-4">
        <h6 className="fw-semibold mb-3">Payment History</h6>
        <div className="table-responsive">
          <table className="table table-stms align-middle">
            <thead><tr><th>Date</th><th>Amount</th><th>Payment Status</th><th>Receipt</th></tr></thead>
            <tbody>
              {paymentHistory.map((h, i) => (
                <tr key={h.receiptId ?? `${h.date}-${h.amount}-${i}`}>
                  <td>{h.date}</td>
                  <td>₹{formatINR(h.amount)}</td>
                  <td><span className={`badge rounded-pill ${h.status === 'Paid' ? 'bg-teal-soft' : 'bg-coral-soft'}`}>{h.status}</span></td>
                  <td>
                    {h.receiptId ? (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleDownload(h.receiptId)}
                        disabled={downloadingId === h.receiptId}
                      >
                        {downloadingId === h.receiptId ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-download me-1"></i>Download Receipt</>}
                      </button>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {paymentHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted small py-4">
                    No payment history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          student={student}
          amount={f.pendingAmount}
          paying={paying}
          onClose={() => !paying && setShowPaymentModal(false)}
          onPay={handlePay}
        />
      )}
    </Layout>
  )
}