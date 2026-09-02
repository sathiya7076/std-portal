import React, { useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'
import { mockAttendance } from '../../mock/mockData'

export default function StudentRegister() {
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [registered, setRegistered] = useState(user?.fingerprintRegistered || false)

  const handleScan = async () => {
    setScanning(true)
    await studentService.registerFingerprint()
    setScanning(false)
    setRegistered(true)
  }

  return (
    <Layout breadcrumb={['Student', 'Student Register']}>
      <h4 className="font-display fw-bold mb-1">Student Registration</h4>
      <p className="text-muted mb-4">Simulated biometric registration — no hardware required for this demo.</p>

      <div className="row">
        <div className="col-lg-5 mb-4">
          <div className="surface-card p-4 text-center h-100">
            <div className={`fingerprint-pad ${registered ? 'scanned' : ''}`}>
              {scanning && <div className="scan-line"></div>}
              <i className={`bi ${registered ? 'bi-fingerprint text-teal' : 'bi-fingerprint'}`}></i>
            </div>
            <p className="text-muted small mt-3 mb-3">
              {registered ? '✓ Fingerprint Registered Successfully' : scanning ? 'Scanning fingerprint...' : 'Place your finger on the scanner to register.'}
            </p>
            <button className="btn btn-primary-stms" onClick={handleScan} disabled={scanning || registered}>
              {scanning ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Scanning...</>
              ) : registered ? (
                <><i className="bi bi-check-circle me-1"></i>Registered</>
              ) : (
                'Register Fingerprint'
              )}
            </button>
          </div>
        </div>

        <div className="col-lg-7 mb-4">
          <div className="surface-card p-4 h-100">
            <h6 className="fw-semibold mb-3">Registration Details</h6>
            {!registered ? (
              <p className="text-muted small">Details will appear here once your fingerprint is registered.</p>
            ) : (
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="text-muted">Student Name</td><td className="fw-semibold">{user?.name}</td></tr>
                  <tr><td className="text-muted">Student ID</td><td className="fw-semibold">{user?.id}</td></tr>
                  <tr><td className="text-muted">Course</td><td className="fw-semibold">{user?.course}</td></tr>
                  <tr><td className="text-muted">Total Working Days</td><td className="fw-semibold">{mockAttendance.totalWorkingDays}</td></tr>
                  <tr><td className="text-muted">Present</td><td className="fw-semibold text-teal">{mockAttendance.present}</td></tr>
                  <tr><td className="text-muted">Absent</td><td className="fw-semibold text-danger">{mockAttendance.absent}</td></tr>
                  <tr><td className="text-muted">Attendance</td><td className="fw-semibold">{mockAttendance.percentage}%</td></tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
