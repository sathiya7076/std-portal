const Task = require("../models/Task");
const TaskSubmission = require("../models/TaskSubmission");

/**
 * Returns tasks assigned to a student, split by simple status buckets
 * used on the student dashboard/task list screens.
 */
const getStudentTaskBuckets = async (studentId) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const tasks = await Task.find({ assignedTo: studentId }).populate(
    "courseId",
    "name"
  );

  const submissions = await TaskSubmission.find({ studentId });
  const submissionByTask = new Map(
    submissions.map((s) => [s.taskId.toString(), s])
  );

  const today = [];
  const pending = [];
  const completed = [];

  for (const task of tasks) {
    const submission = submissionByTask.get(task._id.toString());
    const isCompleted =
      submission &&
      ["submitted", "evaluated", "completed"].includes(submission.status);

    if (isCompleted) {
      completed.push({ task, submission });
    } else {
      pending.push({ task, submission: submission || null });
    }

    if (task.dueDate >= startOfToday && task.dueDate <= endOfToday) {
      today.push({ task, submission: submission || null });
    }
  }

  return { all: tasks, today, pending, completed };
};

module.exports = { getStudentTaskBuckets };
