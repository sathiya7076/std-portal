import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import trainerService from '../../services/trainerService'

export default function TrainerProfile() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ phone: '', experience: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await trainerService.getProfile()
      setProfile(data)
      setForm({ phone: data.phone || '', experience: data.experience || '' })
    } catch (err) {
      console.error('Failed to fetch trainer profile:', err.response?.data || err.message)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await trainerService.updateProfile({
        phone: form.phone,
        experience: form.experience,
      })
      setProfile(updated)
      updateUser({ phone: updated.phone, experience: updated.experience })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to update trainer profile:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout breadcrumb={['Trainer', 'Trainer Profile']}>
        <div>Loading profile...</div>
      </Layout>
    )
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
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="surface-card p-4" style={{ maxWidth: 620 }}>
        {!editing ? (
          <table className="table table-borderless mb-0">
            <tbody>
              <tr><td className="text-muted">Trainer Name</td><td className="fw-semibold">{profile?.trainerName}</td></tr>
              <tr><td className="text-muted">Trainer ID</td><td className="fw-semibold">{profile?.trainerId}</td></tr>
              <tr><td className="text-muted">Email</td><td className="fw-semibold">{profile?.email}</td></tr>
              <tr><td className="text-muted">Phone</td><td className="fw-semibold">{profile?.phone}</td></tr>
              <tr>
                <td className="text-muted">Teaching Course</td>
                <td className="fw-semibold">
                  {profile?.teachingCourses?.map((c) => c.name).join(', ') || '—'}
                </td>
              </tr>
              <tr><td className="text-muted">Experience</td><td className="fw-semibold">{profile?.experience}</td></tr>
              <tr>
                <td className="text-muted">Specialization</td>
                <td>
                  {profile?.specialization?.map((s) => (
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
              <input className="form-control" value={profile?.email || ''} disabled readOnly />
              <small className="text-muted">Email can't be changed here.</small>
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