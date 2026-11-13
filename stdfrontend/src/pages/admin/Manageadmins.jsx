import { useCallback, useEffect, useState } from "react";
import { adminService, errMsg } from "../../services/adminService";

const EMPTY = {
  name: "",
  email: "",
  password: "",
  phone: "",
  designation: "",
  department: "",
};

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await adminService.getAdmins();
      setAdmins(d.admins);
    } catch (e) {
      setMsg({ type: "danger", text: errMsg(e) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createAdmin(form);
      setMsg({ type: "success", text: "Admin created" });
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const toggle = async (a) => {
    try {
      await adminService.toggleUserStatus(a._id);
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete admin ${a.name}?`)) return;
    try {
      await adminService.deleteUser(a._id);
      setMsg({ type: "success", text: "Admin deleted" });
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Admins</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ Add Admin"}
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
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Name *</label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={change}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={change}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Password * (min 6)</label>
              <input
                type="password"
                minLength={6}
                className="form-control"
                name="password"
                value={form.password}
                onChange={change}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={change}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Designation</label>
              <input
                className="form-control"
                name="designation"
                value={form.designation}
                onChange={change}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Department</label>
              <input
                className="form-control"
                name="department"
                value={form.department}
                onChange={change}
              />
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-success">Create Admin</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Admin</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="fw-semibold">{a.name}</div>
                    <div className="small text-muted">{a.email}</div>
                  </td>
                  <td>{a.designation || "-"}</td>
                  <td>{a.department || "-"}</td>
                  <td>{a.phone || "-"}</td>
                  <td>
                    <span
                      className={`badge ${a.isActive ? "bg-success" : "bg-secondary"}`}
                    >
                      {a.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => toggle(a)}
                      >
                        {a.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => remove(a)}
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