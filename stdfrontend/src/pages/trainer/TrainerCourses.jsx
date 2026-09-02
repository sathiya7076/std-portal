import { useState, useEffect } from "react";
import courseService from "../../services/courseService";

const initialFormState = {
  name: "",
  description: "",
  technologies: "",
  roadmap: "",
  duration: "",
  fees: "",
  trainerId: "",
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
      const data = await courseService.getCourses();
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

      if (formData.trainerId.trim() !== "") {
        payload.append("trainerId", formData.trainerId.trim());
      }

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
      setFormData(initialFormState);
      setImageFile(null);
      e.target.reset();
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
      <h2>Manage Courses</h2>

      <form onSubmit={handleCreate} style={{ marginBottom: "2rem" }}>
        {errors.length > 0 && (
          <ul style={{ color: "red" }}>
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

        <div>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Course name" required />
        </div>
        <div>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
        </div>
        <div>
          <input name="technologies" value={formData.technologies} onChange={handleChange} placeholder="Technologies (comma separated)" />
        </div>
        <div>
          <textarea name="roadmap" value={formData.roadmap} onChange={handleChange} placeholder="Roadmap outline" />
        </div>
        <div>
          <input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 6 Months" required />
        </div>
        <div>
          <input type="number" name="fees" value={formData.fees} onChange={handleChange} placeholder="Fees" min="0" required />
        </div>
        <div>
          <input name="trainerId" value={formData.trainerId} onChange={handleChange} placeholder="Trainer ID (optional)" />
        </div>
        <div>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Course"}
        </button>
      </form>

      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
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
          {courses.map((course) => (
            <tr key={course._id}>
              <td>{course.name}</td>
              <td>{course.duration}</td>
              <td>{course.fees}</td>
              <td>{course.status}</td>
              <td>
                {course.image ? (
                  <img src={`http://localhost:5000${course.image}`} alt={course.name} width="60" />
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainerCourses;