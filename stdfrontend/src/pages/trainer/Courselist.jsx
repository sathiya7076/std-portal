import { useState, useEffect } from "react";
import courseService from "../../services/courseService";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
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
      )}
    </div>
  );
};

export default CourseList;