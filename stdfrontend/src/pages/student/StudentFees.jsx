import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import PaymentModal from './Paymentmodel'
import feeService from '../../services/feeService'

export default function StudentFees() {
  const [state, setState] = useState({ loading: true, error: null, fees: null })
  const [downloadingId, setDownloadingId] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [justPaidReceiptId, setJustPaidReceiptId] = useState(null)

  const load = async () => {
    setState({ loading: true, error: null, fees: null })
    try {
      const fees = await feeService.getMyFees()
      setState({ loading: false, error: null, fees })
    } catch {
      setState({ loading: false, error: 'Unable to load fee details.', fees: null })
    }
  }

  useEffect(() => { load() }, [])

  const handleDownload = async (receiptId) => {
    setDownloadingId(receiptId)
    await feeService.downloadReceipt(receiptId)
    setDownloadingId(null)
  }

  const handlePay = async (payload) => {
    setPaying(true)
    setPaymentError(null)
    try {
      const result = await feeService.payFees(payload)
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
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleDownload(justPaidReceiptId)}
            disabled={downloadingId === justPaidReceiptId}
          >
            {downloadingId === justPaidReceiptId
              ? <span className="spinner-border spinner-border-sm"></span>
              : <><i className="bi bi-download me-1"></i>Download Receipt</>}
          </button>
        </div>
      )}

      {paymentError && (
        <div className="alert alert-danger mb-4" role="alert">{paymentError}</div>
      )}

      <div className="row mb-2">
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className="stat-icon bg-indigo-soft"><i className="bi bi-receipt"></i></span>
            <div className="stat-value">₹{f.totalFees.toLocaleString('en-IN')}</div>
            <div className="stat-label">Course Total Fees</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className="stat-icon bg-teal-soft"><i className="bi bi-cash-stack"></i></span>
            <div className="stat-value">₹{f.paidAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Paid Amount</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className="stat-icon bg-coral-soft"><i className="bi bi-exclamation-circle"></i></span>
            <div className="stat-value">₹{f.pendingAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Pending Amount</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card mb-4">
            <span className={`badge rounded-pill ${statusBadge} mb-2`}>{f.status}</span>
            <div className="stat-label">Payment Status</div>
            {f.pendingAmount > 0 && (
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
              {f.history.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td>₹{h.amount.toLocaleString('en-IN')}</td>
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