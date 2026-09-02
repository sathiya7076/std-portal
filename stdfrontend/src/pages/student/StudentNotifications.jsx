import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import NotificationItem from '../../components/NotificationItem'
import notificationService from '../../services/notificationService'

export default function StudentNotifications() {
  const [state, setState] = useState({ loading: true, error: null, notifications: [] })

  const load = async () => {
    setState({ loading: true, error: null, notifications: [] })
    try {
      const notifications = await notificationService.getAll()
      setState({ loading: false, error: null, notifications })
    } catch {
      setState({ loading: false, error: 'Unable to load notifications.', notifications: [] })
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    const updated = await notificationService.markAsRead(id)
    setState((s) => ({ ...s, notifications: updated }))
  }

  const markAllRead = async () => {
    const updated = await notificationService.markAllAsRead()
    setState((s) => ({ ...s, notifications: updated }))
  }

  const breadcrumb = ['Student', 'Notifications']
  if (state.loading) return <Layout breadcrumb={breadcrumb}><Loading message="Loading notifications..." /></Layout>
  if (state.error) return <Layout breadcrumb={breadcrumb}><ErrorMessage message={state.error} onRetry={load} /></Layout>

  const unreadCount = state.notifications.filter((n) => !n.read).length

  return (
    <Layout breadcrumb={breadcrumb}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="font-display fw-bold mb-0">Notifications {unreadCount > 0 && <span className="badge bg-indigo-soft ms-2">{unreadCount} new</span>}</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark All as Read
        </button>
      </div>

      <div className="surface-card">
        {state.notifications.length === 0 ? (
          <EmptyState icon="bi-bell-slash" title="You're all caught up" message="No notifications right now." />
        ) : (
          state.notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
          ))
        )}
      </div>
    </Layout>
  )
}
