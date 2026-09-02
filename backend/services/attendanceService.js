const Attendance = require("../models/Attendance");

/**
 * Computes attendance summary stats for a single student.
 * Attendance Percentage = Present / Total Working Days * 100
 * "Total Working Days" is interpreted as the total number of
 * attendance records logged for the student (i.e. days attendance
 * was tracked), which is the standard definition when there is no
 * separate academic-calendar model.
 */
const getStudentAttendanceSummary = async (studentId) => {
  const records = await Attendance.find({ studentId });

  const totalWorkingDays = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;

  const attendancePercentage =
    totalWorkingDays > 0 ? (present / totalWorkingDays) * 100 : 0;

  return {
    totalWorkingDays,
    present,
    absent,
    late,
    attendancePercentage: Number(attendancePercentage.toFixed(2)),
  };
};

module.exports = { getStudentAttendanceSummary };
