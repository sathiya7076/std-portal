import { useCallback, useEffect, useState } from "react";
import { adminService, errMsg } from "../../services/adminService";

const EMPTY = {
  name: "",
  code: "",
  duration: "",
  fees: "",
  description: "",
  technologies: "",
  status: "active",
  trainerId: "",
};

/**
 * Admin course management (create / edit / delete / assign trainer).
 * Course IMAGE upload stays in your existing trainer course form.
 */
export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]); // approved trainers for dropdown
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        adminService.getCourses({ limit: 100 }),
        adminService.getTrainers({ status: "approved", limit: 100 }),
      ]);
      setCourses(c.courses);
      setTrainers(t.trainers.filter((x) => x.profile && x.user.isActive));
    } catch (e) {
      setMsg({ type: "danger", text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || "",
      code: c.code || "",
      duration: c.duration || "",
      fees: c.fees ?? "",
      description: c.description || "",
      technologies: (c.technologies || []).join(", "),
      status: c.status || "active",
      trainerId: c.trainerId?._id || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      name: form.name,
      code: form.code,
      duration: form.duration,
      fees: Number(form.fees),
      description: form.description,
      technologies: form.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
    };

    try {
      if (editingId) {
        await adminService.updateCourse(editingId, body);
        // trainer is changed through the assign endpoint
        const current = courses.find((c) => c._id === editingId);
        if (form.trainerId && form.trainerId !== current?.trainerId?._id) {
          await adminService.assignTrainer(editingId, form.trainerId);
        }
        setMsg({ type: "success", text: "Course updated" });
      } else {
        await adminService.createCourse({
          ...body,
          trainerId: form.trainerId || undefined,
        });
        setMsg({ type: "success", text: "Course created" });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete course "${c.name}"?`)) return;
    try {
      await adminService.deleteCourse(c._id);
      setMsg({ type: "success", text: "Course deleted" });
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Manage Courses</h3>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Course
        </button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible`}>
          {msg.text}
          <button className="btn-close" onClick={() => setMsg(null)} />
        </div>
      )}

      {showForm && (
        <form className="card card-body mb-4" onSubmit={submit}>
          <h5>{editingId ? "Edit Course" : "New Course"}</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Course name *</label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={change}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Code</label>
              <input
                className="form-control"
                name="code"
                value={form.code}
                onChange={change}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="status"
                value={form.status}
                onChange={change}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Duration * (e.g. 6 Months)</label>
              <input
                className="form-control"
                name="duration"
                value={form.duration}
                onChange={change}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fees *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                name="fees"
                value={form.fees}
                onChange={change}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Trainer</label>
              <select
                className="form-select"
                name="trainerId"
                value={form.trainerId}
                onChange={change}
              >
                <option value="">-- Not assigned --</option>
                {trainers.map(({ user, profile }) => (
                  <option key={profile._id} value={profile._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Technologies (comma separated)</label>
              <input
                className="form-control"
                name="technologies"
                value={form.technologies}
                onChange={change}
                placeholder="React.js, Node.js, MongoDB"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="3"
                name="description"
                value={form.description}
                onChange={change}
              />
            </div>
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-success">
              {editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Course</th>
                <th>Duration</th>
                <th>Fees</th>
                <th>Trainer</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && courses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No courses yet
                  </td>
                </tr>
              )}
              {!loading &&
                courses.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="fw-semibold">{c.name}</div>
                      {c.code && <div className="small text-muted">{c.code}</div>}
                    </td>
                    <td>{c.duration}</td>
                    <td>₹{Number(c.fees).toLocaleString("en-IN")}</td>
                    <td>{c.trainerId?.userId?.name || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          c.status === "active" ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => remove(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}