import { useState, useEffect } from "react";
import courseService from "../../services/courseService";
import notificationService from "../../services/notificationService";

const initialFormState = {
  name: "",
  description: "",
  technologies: "",
  roadmap: "",
  duration: "",
  fees: "",
  status: "active",
};

const TrainerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to fetch courses:", err.response?.data || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0] || null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    if (!formData.fees || Number.isNaN(Number(formData.fees))) {
      setErrors(["Please enter a valid fee amount"]);
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("roadmap", formData.roadmap);
      payload.append("duration", formData.duration);
      payload.append("fees", formData.fees);
      payload.append("status", formData.status);

      formData.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((tech) => payload.append("technologies", tech));

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const newCourse = await courseService.createCourse(payload);
      setCourses((prev) => [newCourse, ...prev]);

      try {
        await notificationService.notifyCourseAdded(newCourse.name);
      } catch (notifyErr) {
        console.error("Failed to send course-added notification:", notifyErr);
      }

      setFormData(initialFormState);
      setImageFile(null);
      e.target.reset();

      await fetchCourses();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      setErrors(serverErrors && serverErrors.length ? serverErrors : [err.message]);
      console.error("Failed to create course. Status:", err.response?.status);
      console.error("Failed to create course. Data:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      {/* ADDED: style-only block for spacing + hover effects, nothing else changed */}
      <style>{`
        .tc-form-row { margin-bottom: 1rem; }
        .tc-form-row input,
        .tc-form-row textarea,
        .tc-form-row select {
          padding: 8px 10px;
          border: 1px solid #d0d5dd;
          border-radius: 6px;
          width: 100%;
          max-width: 420px;
          box-sizing: border-box;
        }
        .tc-submit-btn {
          margin-top: 0.5rem;
          padding: 8px 20px;
          border: none;
          border-radius: 6px;
          background: #4f46e5;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .tc-submit-btn:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
        }
        .tc-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .tc-table { margin-top: 1.5rem; }
        .tc-table tbody tr {
          transition: background 0.15s ease;
        }
        .tc-table tbody tr:hover {
          background: #f5f6ff;
        }
        .tc-table th, .tc-table td {
          padding: 10px 8px;
        }
      `}</style>

      <h2 style={{ marginBottom: "1rem" }}>Manage Courses</h2>

      <form onSubmit={handleCreate} style={{ marginBottom: "2rem" }}>
        {errors.length > 0 && (
          <ul style={{ color: "red", marginBottom: "1rem" }}>
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="tc-form-row">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Course name" required />
        </div>
        <div className="tc-form-row">
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
        </div>
        <div className="tc-form-row">
          <input name="technologies" value={formData.technologies} onChange={handleChange} placeholder="Technologies (comma separated)" />
        </div>
        <div className="tc-form-row">
          <textarea name="roadmap" value={formData.roadmap} onChange={handleChange} placeholder="Roadmap outline" />
        </div>
        <div className="tc-form-row">
          <input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 6 Months" required />
        </div>
        <div className="tc-form-row">
          <input type="number" name="fees" value={formData.fees} onChange={handleChange} placeholder="Fees" min="0" required />
        </div>
        <div className="tc-form-row">
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="tc-form-row">
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <button type="submit" className="tc-submit-btn" disabled={loading}>
          {loading ? "Creating..." : "Create Course"}
        </button>
      </form>

      <table border="1" cellPadding="8" className="tc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Duration</th>
            <th>Fees</th>
            <th>Status</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {courses.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No courses yet.
              </td>
            </tr>
          ) : (
            courses.map((course) => (
              <tr key={course._id || course.id}>
                <td>{course.name}</td>
                <td>{course.duration}</td>
                <td>{course.fees}</td>
                <td>{course.status}</td>
                <td>
                  {course.image ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${course.image}`}
                      alt={course.name}
                      width="60"
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TrainerCourses;