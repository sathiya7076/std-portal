import { useCallback, useEffect, useState } from "react";
import { adminService, errMsg } from "../../services/adminService";

export default function ManageStudents() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getStudents({ search, limit: 100 });
      setRows(d.students);
    } catch (e) {
      setMsg({ type: "danger", text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okText) => {
    try {
      await fn();
      setMsg({ type: "success", text: okText });
      load();
    } catch (e) {
      setMsg({ type: "danger", text: errMsg(e) });
    }
  };

  const toggle = (u) =>
    run(
      () => adminService.toggleUserStatus(u._id),
      `${u.name} ${u.isActive ? "deactivated" : "activated"}`
    );

  const resetPw = (u) => {
    const pw = window.prompt(`New password for ${u.name} (min 6 characters):`);
    if (!pw) return;
    run(() => adminService.resetPassword(u._id, pw), "Password reset");
  };

  const remove = (u) => {
    if (!window.confirm(`Delete student ${u.name}? This cannot be undone.`)) return;
    run(() => adminService.deleteUser(u._id), `${u.name} deleted`);
  };

  return (
    <div>
      <h3 className="mb-3">Manage Students</h3>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible`}>
          {msg.text}
          <button className="btn-close" onClick={() => setMsg(null)} />
        </div>
      )}

      <form
        className="d-flex gap-2 mb-3"
        style={{ maxWidth: 420 }}
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
      >
        <input
          className="form-control"
          placeholder="Search name / email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button className="btn btn-outline-primary">Search</button>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Course</th>
                <th>Phone</th>
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No students found
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map(({ user: u, profile: p }) => (
                  <tr key={u._id}>
                    <td>
                      <div className="fw-semibold">{u.name}</div>
                      <div className="small text-muted">{u.email}</div>
                    </td>
                    <td>{p?.studentId || "-"}</td>
                    <td>{p?.courseId?.name || "-"}</td>
                    <td>{p?.phone || "-"}</td>
                    <td>
                      <span
                        className={`badge ${u.isActive ? "bg-success" : "bg-secondary"}`}
                      >
                        {u.isActive ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => toggle(u)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => resetPw(u)}
                        >
                          Reset password
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => remove(u)}
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