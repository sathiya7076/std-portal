import React, { useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'

export default function TrainerProfile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    experience: user?.experience || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    }, 600)
  }

  return (
    <Layout breadcrumb={['Trainer', 'Trainer Profile']}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="font-display fw-bold mb-0">Trainer Profile</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing((e) => !e)}>
          <i className="bi bi-pencil me-1"></i>{editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {saved && <div className="alert alert-success py-2 small">Profile updated successfully!</div>}

      <div className="surface-card p-4" style={{ maxWidth: 620 }}>
        {!editing ? (
          <table className="table table-borderless mb-0">
            <tbody>
              <tr><td className="text-muted">Trainer Name</td><td className="fw-semibold">{user?.name}</td></tr>
              <tr><td className="text-muted">Trainer ID</td><td className="fw-semibold">{user?.id}</td></tr>
              <tr><td className="text-muted">Email</td><td className="fw-semibold">{user?.email}</td></tr>
              <tr><td className="text-muted">Phone</td><td className="fw-semibold">{user?.phone}</td></tr>
              <tr><td className="text-muted">Teaching Course</td><td className="fw-semibold">{user?.course}</td></tr>
              <tr><td className="text-muted">Experience</td><td className="fw-semibold">{user?.experience}</td></tr>
              <tr>
                <td className="text-muted">Specialization</td>
                <td>
                  {user?.specialization?.map((s) => (
                    <span key={s} className="badge bg-indigo-soft me-1">{s}</span>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email</label>
              <input className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Experience</label>
              <input className="form-control" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            </div>
            <button className="btn btn-primary-stms" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  )
}
