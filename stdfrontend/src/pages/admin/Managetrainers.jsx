import { useCallback, useEffect, useState } from "react";
import { adminService, errMsg } from "../../services/adminService";

const TABS = ["pending", "approved", "rejected"];

const badgeClass = {
  pending: "bg-warning text-dark",
  approved: "bg-success",
  rejected: "bg-danger",
};

export default function ManageTrainers() {
  const [status, setStatus] = useState("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getTrainers({ status, search, limit: 100 });
      setRows(d.trainers);
    } catch (e) {
      setMsg({ type: "danger", text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [status, search]);

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

  const approve = (u) =>
    run(() => adminService.approveTrainer(u._id), `${u.name} approved`);

  const reject = (u) => {
    const reason = window.prompt(`Reason for rejecting ${u.name} (optional):`);
    if (reason === null) return; // cancelled
    run(() => adminService.rejectTrainer(u._id, reason), `${u.name} rejected`);
  };

  const toggle = (u) =>
    run(
      () => adminService.toggleUserStatus(u._id),
      `${u.name} ${u.isActive ? "deactivated" : "activated"}`
    );

  const remove = (u) => {
    if (!window.confirm(`Delete trainer ${u.name}? This cannot be undone.`)) return;
    run(() => adminService.deleteUser(u._id), `${u.name} deleted`);
  };

  return (
    <div>
      <h3 className="mb-3">Manage Trainers</h3>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible`}>
          {msg.text}
          <button className="btn-close" onClick={() => setMsg(null)} />
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <ul className="nav nav-pills">
          {TABS.map((t) => (
            <li className="nav-item" key={t}>
              <button
                className={`nav-link text-capitalize ${status === t ? "active" : ""}`}
                onClick={() => setStatus(t)}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>

        <form
          className="d-flex gap-2"
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
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Trainer</th>
                <th>ID</th>
                <th>Specialization</th>
                <th>Exp</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No {status} trainers
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map(({ user: u, profile: p }) => {
                  const st = u.approvalStatus || "approved";
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="fw-semibold">{u.name}</div>
                        <div className="small text-muted">{u.email}</div>
                        {st === "rejected" && u.rejectionReason && (
                          <div className="small text-danger">
                            Reason: {u.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td>{p?.trainerId || "-"}</td>
                      <td>{p?.specialization || "-"}</td>
                      <td>{p?.experience ?? "-"}</td>
                      <td>{p?.phone || "-"}</td>
                      <td>
                        <span className={`badge ${badgeClass[st]}`}>{st}</span>
                        {!u.isActive && (
                          <span className="badge bg-secondary ms-1">inactive</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {st !== "approved" && (
                            <button
                              className="btn btn-success"
                              onClick={() => approve(u)}
                            >
                              Approve
                            </button>
                          )}
                          {st === "pending" && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => reject(u)}
                            >
                              Reject
                            </button>
                          )}
                          {st === "approved" && (
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => toggle(u)}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          <button
                            className="btn btn-outline-dark"
                            onClick={() => remove(u)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}