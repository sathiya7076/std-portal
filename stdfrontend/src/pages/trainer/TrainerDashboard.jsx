import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ProgressBar from '../../components/ProgressBar'
import studentService from '../../services/studentService'

// Trainer Dashboard — lists every registered student with their
// attendance % and learning progress %, so a trainer can scan the
// whole cohort at a glance instead of opening each profile.
//
// Uses studentService.getAllStudents(), which already returns
// normalized student objects (see normalizeStudent in
// studentService.js): s._id is the Mongo id (used for links),
// s.studentId is the human-readable code (display only).

export default function TrainerDashboard() {
  const [state, setState] = useState({ loading: true, error: null, students: [] })
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')

  // FIX: master course list, built once from the unfiltered dataset,
  // so the dropdown doesn't shrink to whatever the current filter shows.
  const [allCourses, setAllCourses] = useState([])

  // FIX: debounce the search box so we don't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // FIX: race-condition guard. requestIdRef tracks the latest request;
  // if an older request's response comes back after a newer one, it's ignored.
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const thisRequestId = ++requestIdRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const students = await studentService.getAllStudents({ search: debouncedSearch, course })
      if (thisRequestId !== requestIdRef.current) return // a newer request won the race, ignore this one
      setState({ loading: false, error: null, students })

      // Build the master course list only from an unfiltered fetch,
      // so switching filters later never hides other courses.
      if (!course && !debouncedSearch) {
        setAllCourses([...new Set(students.map((s) => s.course).filter(Boolean))])
      }
    } catch {
      if (thisRequestId !== requestIdRef.current) return
      setState({ loading: false, error: 'Unable to load students.', students: [] })
    }
  }, [debouncedSearch, course])

  useEffect(() => { load() }, [load])

  // ADDED: today's attendance + "what they're currently doing" per student.
  // Calls studentService.getTodayAttendanceMap() (see studentService.js).
  // If it's ever missing/renamed, this fails silently and the UI just
  // shows "Not marked" badges — it won't crash the dashboard.
  const [todayAttendance, setTodayAttendance] = useState({})
  useEffect(() => {
    let cancelled = false
    const loadAttendance = async () => {
      try {
        if (typeof studentService.getTodayAttendanceMap !== 'function') return
        const data = await studentService.getTodayAttendanceMap()

        // FIX: the endpoint may return either an object already keyed by
        // student id, OR a plain array of attendance records. Normalize
        // both shapes into a single { [id]: record } lookup so the rest
        // of the component doesn't have to care which one comes back.
        let normalized = {}
        if (Array.isArray(data)) {
          data.forEach((record) => {
            // FIX: try every id field we've seen used for this across the
            // codebase (studentId, _id, student, studentId as populated ref).
            const key =
              record.studentId ??
              record._id ??
              record.student?._id ??
              record.student
            if (key) normalized[key] = record
          })
        } else if (data && typeof data === 'object') {
          normalized = data
        }

        // TEMP DEBUG: remove once attendance shows correctly.
        // Open the browser console and check this log — it tells you
        // exactly what shape the backend is sending and what keys exist.
        console.log('[TrainerDashboard] attendance map (normalized):', normalized)

        if (!cancelled) setTodayAttendance(normalized)
      } catch (err) {
        console.error('[TrainerDashboard] failed to load attendance map:', err)
        if (!cancelled) setTodayAttendance({})
      }
    }
    loadAttendance()
    return () => { cancelled = true }
  }, [state.students])

  // FIX: check studentId, _id, and string-cast versions of both, since we
  // don't yet know for certain which one the backend attendance record
  // uses as its key (Mongo ObjectIds vs strings can mismatch here).
  const getAttendanceRecord = (s) =>
    todayAttendance[s.studentId] ??
    todayAttendance[s._id] ??
    todayAttendance[String(s.studentId)] ??
    todayAttendance[String(s._id)]

  const renderAttendanceBadge = (s) => {
    const record = getAttendanceRecord(s)
    // FIX: some backends call this field attendanceStatus / present
    // instead of status — check the common alternatives before giving up.
    const status = record?.status ?? record?.attendanceStatus ?? (record?.present === true ? 'present' : record?.present === false ? 'absent' : undefined)

    if (!record || !status) {
      return <span className="badge bg-secondary">Not marked</span>
    }
    // FIXED: "late" was previously falling into the default/absent branch
    // below, mislabeling late check-ins as "Absent today". Now handled
    // as its own state, matching the present/late/absent values the
    // backend's computeAttendanceStatus() can actually return.
    if (status === 'present') {
      return <span className="badge bg-success">Present today</span>
    }
    if (status === 'late') {
      return <span className="badge bg-warning text-dark">Late today</span>
    }
    return <span className="badge bg-danger">Absent today</span>
  }

  return (
    <Layout breadcrumb={['Trainer', 'Dashboard']}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h4 className="font-display fw-bold mb-0">Student Progress</h4>
      
      </div>

      <div className="d-flex gap-2 flex-wrap mb-4">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ maxWidth: 260 }}
          placeholder="Search by name or student ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 200 }}
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {allCourses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {state.loading && <Loading message="Loading students..." />}
      {!state.loading && state.error && (
        <ErrorMessage message={state.error} onRetry={load} />
      )}
      {!state.loading && !state.error && state.students.length === 0 && (
        <EmptyState
          icon="bi-people"
          title="No students registered yet"
          description="Register a student to start tracking their progress."
        />
      )}

      {!state.loading && !state.error && state.students.length > 0 && (
        <div className="row">
          {state.students.map((s) => (
            <div className="col-lg-6 mb-4" key={s._id}>
              <div className="surface-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="fw-semibold mb-1">{s.name}</h6>
                    <p className="text-muted small mb-0">{s.studentId} • {s.course}</p>
                    {/* ADDED: today's attendance status */}
                    <div className="mt-1">{renderAttendanceBadge(s)}</div>
                  </div>
                  <Link
                    to={`/trainer/students/${s._id}`}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    View
                  </Link>
                </div>
                <ProgressBar label="Attendance" percent={s.attendance} />
                <ProgressBar label="Learning Progress" percent={s.progress} />
                {/* ADDED: current activity, if the backend ever provides one */}
                {getAttendanceRecord(s)?.currentActivity && (
                  <p className="text-muted small mt-2 mb-0">
                    <i className="bi bi-activity me-1"></i>
                    Currently: {getAttendanceRecord(s).currentActivity}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}