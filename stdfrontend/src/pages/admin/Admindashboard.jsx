import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService, errMsg } from "../../services/adminService";

const Card = ({ title, value, sub, color = "primary" }) => (
  <div className="col-12 col-sm-6 col-lg-3">
    <div className={`card border-${color} h-100`}>
      <div className="card-body">
        <div className="text-muted small">{title}</div>
        <div className={`fs-2 fw-bold text-${color}`}>{value}</div>
        {sub && <div className="small text-muted">{sub}</div>}
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService
      .dashboard()
      .then(setStats)
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return <div className="spinner-border" role="status" />;

  return (
    <div>
      <h3 className="mb-4">Dashboard</h3>

      <div className="row g-3 mb-4">
        <Card title="Students" value={stats.students} color="primary" />
        <Card
          title="Trainers"
          value={stats.trainers.total}
          sub={`${stats.trainers.approved} approved · ${stats.trainers.rejected} rejected`}
          color="success"
        />
        <Card
          title="Pending Trainer Approvals"
          value={stats.trainers.pending}
          color="warning"
        />
        <Card
          title="Courses"
          value={stats.courses.total}
          sub={`${stats.courses.active} active`}
          color="info"
        />
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between">
          <strong>Recent pending trainer requests</strong>
          <Link to="/admin/trainers">Manage trainers</Link>
        </div>
        <ul className="list-group list-group-flush">
          {stats.recentPendingTrainers.length === 0 && (
            <li className="list-group-item text-muted">No pending requests</li>
          )}
          {stats.recentPendingTrainers.map((t) => (
            <li key={t._id} className="list-group-item">
              {t.name} <span className="text-muted">({t.email})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}