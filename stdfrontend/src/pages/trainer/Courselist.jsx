import { useState, useEffect } from "react";
import Layout from "../../components/Layout"; // ADDED
import courseService from "../../services/courseService";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ADDED: state for inline edit
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    duration: "",
    fees: "",
    status: "active",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to fetch courses:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ADDED: start editing a course row
  const handleEditClick = (course) => {
    setEditingId(course._id || course.id);
    setEditFormData({
      name: course.name || "",
      duration: course.duration || "",
      fees: course.fees || "",
      status: course.status || "active",
    });
  };

  // ADDED: cancel editing
  const handleEditCancel = () => {
    setEditingId(null);
  };

  // ADDED: handle edit form field changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ADDED: save edited course
  const handleEditSave = async (courseId) => {
    setSavingEdit(true);
    try {
      await courseService.updateCourse(courseId, editFormData);
      setEditingId(null);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to update course:", err.response?.data || err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ADDED: delete a course
  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }
    setDeletingId(courseId);
    try {
      await courseService.deleteCourse(courseId);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to delete course:", err.response?.data || err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout breadcrumb={['Trainer', 'Courses']}> {/* ADDED: wraps page with sidebar/layout */}
      <div style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>All Courses</h2>

        {loading ? (
          <p>Loading courses...</p>
        ) : (
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration</th>
                <th>Fees</th>
                <th>Status</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No courses yet.
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const courseId = course._id || course.id;
                  const isEditing = editingId === courseId;

                  return (
                    <tr key={courseId}>
                      <td>
                        {isEditing ? (
                          <input
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                          />
                        ) : (
                          course.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="duration"
                            value={editFormData.duration}
                            onChange={handleEditChange}
                          />
                        ) : (
                          course.duration
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="fees"
                            value={editFormData.fees}
                            onChange={handleEditChange}
                            min="0"
                          />
                        ) : (
                          course.fees
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            name="status"
                            value={editFormData.status}
                            onChange={handleEditChange}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                          </select>
                        ) : (
                          course.status
                        )}
                      </td>
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
                      {/* ADDED: Actions column with Edit/Delete (or Save/Cancel while editing) */}
                      <td>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditSave(courseId)}
                              disabled={savingEdit}
                              style={{ marginRight: "6px" }}
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={handleEditCancel}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditClick(course)}
                              style={{ marginRight: "6px" }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(courseId)}
                              disabled={deletingId === courseId}
                            >
                              {deletingId === courseId ? "Deleting..." : "Delete"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default CourseList;