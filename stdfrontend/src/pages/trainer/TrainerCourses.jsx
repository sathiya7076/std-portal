import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ADDED
import Layout from "../../components/Layout"; // ADDED
import courseService from "../../services/courseService";
import notificationService from "../../services/notificationService";

const initialFormState = {
  name: "",
  description: "",
  technologies: "",
  roadmap: "",
  duration: "",
  fees: "",
  code: "", // ADDED
  status: "active",
};

const TrainerCourses = () => {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // ADDED

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
      payload.append("code", formData.code); // ADDED
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
    <Layout breadcrumb={['Trainer', 'Courses', 'Create']}> {/* ADDED */}
      <div style={{ padding: "1rem" }}>
        <style>{`
          /* ===== Create Course form — restyled (card layout) ===== */
          .tc-create-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04);
            padding: 1.75rem;
            margin: 0 auto 2rem auto;
            max-width: 720px;
          }
          .tc-create-card h2 {
            margin: 0 0 0.25rem 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: #101828;
          }
          .tc-create-card .tc-subtitle {
            margin: 0 0 1.5rem 0;
            font-size: 0.875rem;
            color: #667085;
          }
          .tc-error-box {
            background: #fef3f2;
            border: 1px solid #fecdca;
            color: #b42318;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            margin-bottom: 1.25rem;
            font-size: 0.875rem;
          }
          .tc-error-box ul {
            margin: 0;
            padding-left: 1.1rem;
          }
          .tc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem 1.25rem;
          }
          .tc-field {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin-bottom: 0;
          }
          .tc-field.tc-span-2 {
            grid-column: 1 / -1;
          }
          .tc-field label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #344054;
          }
          .tc-field input,
          .tc-field textarea,
          .tc-field select {
            padding: 10px 12px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            width: 100%;
            box-sizing: border-box;
            font-size: 0.9rem;
            color: #101828;
            background: #fff;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .tc-field textarea {
            min-height: 80px;
            resize: vertical;
          }
          .tc-field input:focus,
          .tc-field textarea:focus,
          .tc-field select:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          }
          .tc-field input[type="file"] {
            padding: 6px;
            border-style: dashed;
            background: #f9fafb;
          }
          .tc-form-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }
          .tc-submit-btn {
            padding: 10px 24px;
            border: none;
            border-radius: 8px;
            background: #4f46e5;
            color: #fff;
            font-weight: 600;
            font-size: 0.9rem;
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

          /* ===== Table (unchanged) ===== */
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

        <div className="tc-create-card">
          <h2>Create Course</h2>
          <p className="tc-subtitle">Fill in the details below to add a new course.</p>

          <form onSubmit={handleCreate}>
            {errors.length > 0 && (
              <div className="tc-error-box">
                <ul>
                  {errors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="tc-grid">
              <div className="tc-field tc-span-2">
                <label htmlFor="tc-name">Course name</label>
                <input id="tc-name" name="name" value={formData.name} onChange={handleChange} placeholder="Course name" required />
              </div>

              <div className="tc-field tc-span-2">
                <label htmlFor="tc-description">Description</label>
                <textarea id="tc-description" name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
              </div>

              <div className="tc-field tc-span-2">
                <label htmlFor="tc-technologies">Technologies</label>
                <input id="tc-technologies" name="technologies" value={formData.technologies} onChange={handleChange} placeholder="Technologies (comma separated)" />
              </div>

              <div className="tc-field tc-span-2">
                <label htmlFor="tc-roadmap">Roadmap outline</label>
                <textarea id="tc-roadmap" name="roadmap" value={formData.roadmap} onChange={handleChange} placeholder="Roadmap outline" />
              </div>

              <div className="tc-field">
                <label htmlFor="tc-duration">Duration</label>
                <input id="tc-duration" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 6 Months" required />
              </div>

              <div className="tc-field">
                <label htmlFor="tc-fees">Fees</label>
                <input id="tc-fees" type="number" name="fees" value={formData.fees} onChange={handleChange} placeholder="Fees" min="0" required />
              </div>

              {/* ADDED: course code input */}
              <div className="tc-field">
                <label htmlFor="tc-code">Course code</label>
                <input id="tc-code" name="code" value={formData.code} onChange={handleChange} placeholder="Course code (optional)" />
              </div>

              <div className="tc-field">
                <label htmlFor="tc-status">Status</label>
                <select id="tc-status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="tc-field tc-span-2">
                <label htmlFor="tc-image">Course image</label>
                <input id="tc-image" type="file" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>

            <div className="tc-form-actions">
              <button type="submit" className="tc-submit-btn" disabled={loading}>
                {loading ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>

        {/* ADDED: View Course button — navigates to a separate course-list page */}
        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <button
            type="button"
            className="tc-submit-btn"
            onClick={() => navigate("/trainer/courses/list")}
          >
            View Course
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TrainerCourses;