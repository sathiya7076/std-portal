const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");
const Trainer = require("../models/Trainer");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const getPaging = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  return { page, limit, skip: (page - 1) * limit };
};

// Filter on the User collection (name / email search + active flag)
const buildUserFilter = (req, role) => {
  const filter = { role };
  if (req.query.search) {
    const regex = new RegExp(
      req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }
  return filter;
};

// Old trainers created before this feature have no approvalStatus field,
// so "approved" is treated as "not pending and not rejected".
const applyApprovalFilter = (filter, status) => {
  if (!status) return;
  if (status === "approved") {
    filter.approvalStatus = { $nin: ["pending", "rejected"] };
  } else {
    filter.approvalStatus = status;
  }
};

const attachTrainerProfiles = async (users) => {
  const profiles = await Trainer.find({
    userId: { $in: users.map((u) => u._id) },
  }).populate("courseIds", "name");
  const map = new Map(profiles.map((p) => [p.userId.toString(), p]));
  return users.map((u) => ({ user: u, profile: map.get(u._id.toString()) || null }));
};

const attachStudentProfiles = async (users) => {
  const profiles = await Student.find({
    userId: { $in: users.map((u) => u._id) },
  }).populate("courseId", "name duration fees");
  const map = new Map(profiles.map((p) => [p.userId.toString(), p]));
  return users.map((u) => ({ user: u, profile: map.get(u._id.toString()) || null }));
};

const findUserByRole = async (id, role) => {
  const user = await User.findOne({ _id: id, role });
  if (!user) throw new ApiError(404, `${role} not found`);
  return user;
};

// Assign a trainer (Trainer profile _id) to a course and keep both sides in sync
const assignTrainerToCourse = async (course, trainerProfileId) => {
  const trainer = await Trainer.findById(trainerProfileId).populate(
    "userId",
    "isActive approvalStatus"
  );
  if (!trainer || !trainer.userId) throw new ApiError(404, "Trainer not found");

  if (
    !trainer.userId.isActive ||
    ["pending", "rejected"].includes(trainer.userId.approvalStatus)
  ) {
    throw new ApiError(400, "Trainer is inactive or not approved by admin");
  }

  if (course.trainerId && course.trainerId.toString() !== trainer._id.toString()) {
    await Trainer.findByIdAndUpdate(course.trainerId, {
      $pull: { courseIds: course._id },
    });
  }

  course.trainerId = trainer._id;
  await course.save();
  await Trainer.findByIdAndUpdate(trainer._id, {
    $addToSet: { courseIds: course._id },
  });
};

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

// @desc    Dashboard counts
// @route   GET /api/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    students,
    trainersTotal,
    trainersPending,
    trainersRejected,
    admins,
    coursesTotal,
    coursesActive,
    recentPending,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "trainer" }),
    User.countDocuments({ role: "trainer", approvalStatus: "pending" }),
    User.countDocuments({ role: "trainer", approvalStatus: "rejected" }),
    User.countDocuments({ role: "admin" }),
    Course.countDocuments(),
    Course.countDocuments({ status: "active" }),
    User.find({ role: "trainer", approvalStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  return sendSuccess(res, 200, "Dashboard stats fetched", {
    students,
    trainers: {
      total: trainersTotal,
      pending: trainersPending,
      rejected: trainersRejected,
      approved: trainersTotal - trainersPending - trainersRejected,
    },
    admins,
    courses: { total: coursesTotal, active: coursesActive },
    recentPendingTrainers: recentPending,
  });
});

/* ------------------------------------------------------------------ */
/* Trainer management                                                 */
/* ------------------------------------------------------------------ */

// @route   GET /api/admin/trainers?status=pending|approved|rejected&search=&page=&limit=
const getTrainers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req);
  const filter = buildUserFilter(req, "trainer");
  applyApprovalFilter(filter, req.query.status);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const data = await attachTrainerProfiles(users);
  return sendSuccess(res, 200, "Trainers fetched", {
    total,
    page,
    pages: Math.ceil(total / limit),
    trainers: data,
  });
});

// @route   GET /api/admin/trainers/:id      (:id = User _id)
const getTrainerById = asyncHandler(async (req, res) => {
  const user = await findUserByRole(req.params.id, "trainer");
  const [data] = await attachTrainerProfiles([user]);
  return sendSuccess(res, 200, "Trainer fetched", data);
});

// @route   PATCH /api/admin/trainers/:id/approve
const approveTrainer = asyncHandler(async (req, res) => {
  const user = await findUserByRole(req.params.id, "trainer");

  user.approvalStatus = "approved";
  user.approvedBy = req.user._id;
  user.approvedAt = new Date();
  user.rejectionReason = undefined;
  await user.save();

  return sendSuccess(res, 200, "Trainer approved", user);
});

// @route   PATCH /api/admin/trainers/:id/reject     body: { reason }
const rejectTrainer = asyncHandler(async (req, res) => {
  const user = await findUserByRole(req.params.id, "trainer");

  user.approvalStatus = "rejected";
  user.rejectionReason = req.body.reason || "";
  user.approvedBy = undefined;
  user.approvedAt = undefined;
  await user.save();

  return sendSuccess(res, 200, "Trainer rejected", user);
});

/* ------------------------------------------------------------------ */
/* Student management                                                 */
/* ------------------------------------------------------------------ */

// @route   GET /api/admin/students?search=&isActive=&page=&limit=
const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req);
  const filter = buildUserFilter(req, "student");

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const data = await attachStudentProfiles(users);
  return sendSuccess(res, 200, "Students fetched", {
    total,
    page,
    pages: Math.ceil(total / limit),
    students: data,
  });
});

// @route   GET /api/admin/students/:id      (:id = User _id)
const getStudentById = asyncHandler(async (req, res) => {
  const user = await findUserByRole(req.params.id, "student");
  const [data] = await attachStudentProfiles([user]);
  return sendSuccess(res, 200, "Student fetched", data);
});

/* ------------------------------------------------------------------ */
/* Generic user actions (student / trainer / admin)                   */
/* ------------------------------------------------------------------ */

// @route   PUT /api/admin/users/:id     body: { name, phone, designation, department }
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const { name, phone, designation, department } = req.body;
  if (name !== undefined) user.name = name;

  if (user.role === "admin") {
    if (phone !== undefined) user.phone = phone;
    if (designation !== undefined) user.designation = designation;
    if (department !== undefined) user.department = department;
  } else if (phone !== undefined) {
    const Model = user.role === "student" ? Student : Trainer;
    await Model.findOneAndUpdate({ userId: user._id }, { phone });
  }

  await user.save();
  return sendSuccess(res, 200, "User updated", user);
});

// @route   PATCH /api/admin/users/:id/status      (activate / deactivate toggle)
const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.isActive = !user.isActive;
  await user.save();

  return sendSuccess(
    res,
    200,
    `User ${user.isActive ? "activated" : "deactivated"}`,
    user
  );
});

// @route   PATCH /api/admin/users/:id/reset-password     body: { newPassword }
const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.password = newPassword; // hashed by the pre-save hook
  await user.save();

  return sendSuccess(res, 200, "Password reset successfully", null);
});

// @route   DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) throw new ApiError(400, "Cannot delete the last admin");
  }

  if (user.role === "trainer") {
    const profile = await Trainer.findOne({ userId: user._id });
    if (profile) {
      await Course.updateMany(
        { trainerId: profile._id },
        { $unset: { trainerId: "" } }
      );
      await profile.deleteOne();
    }
  }

  if (user.role === "student") {
    await Student.deleteOne({ userId: user._id });
  }

  await user.deleteOne();
  return sendSuccess(res, 200, "User deleted", null);
});

/* ------------------------------------------------------------------ */
/* Admin management                                                   */
/* ------------------------------------------------------------------ */

// @route   GET /api/admin/admins
const getAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "admin" }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, "Admins fetched", { count: admins.length, admins });
});

// @route   POST /api/admin/admins     (existing admin creates another admin)
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, designation, department } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const admin = await User.create({
    name,
    email,
    password,
    phone,
    designation,
    department,
    role: "admin",
    approvalStatus: "approved",
  });

  return sendSuccess(res, 201, "Admin created", admin);
});

/* ------------------------------------------------------------------ */
/* Course management                                                  */
/* (image upload stays in your existing course routes)                */
/* ------------------------------------------------------------------ */

// @route   GET /api/admin/courses?status=&search=&page=&limit=
const getCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const regex = new RegExp(
      req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    filter.$or = [{ name: regex }, { code: regex }];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate({
        path: "trainerId",
        select: "trainerId userId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Courses fetched", {
    total,
    page,
    pages: Math.ceil(total / limit),
    courses,
  });
});

// @route   GET /api/admin/courses/:id   (course + enrolled students)
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate({
    path: "trainerId",
    select: "trainerId userId",
    populate: { path: "userId", select: "name email" },
  });
  if (!course) throw new ApiError(404, "Course not found");

  const students = await Student.find({ courseId: course._id }).populate(
    "userId",
    "name email"
  );

  return sendSuccess(res, 200, "Course fetched", { course, students });
});

// @route   POST /api/admin/courses
const createCourse = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    technologies,
    roadmap,
    duration,
    fees,
    code,
    status,
    trainerId,
  } = req.body;

  if (!name || !duration || fees === undefined) {
    throw new ApiError(400, "Course name, duration and fees are required");
  }

  const course = await Course.create({
    name,
    description,
    technologies,
    roadmap,
    duration,
    fees,
    code,
    status,
  });

  if (trainerId) await assignTrainerToCourse(course, trainerId);

  return sendSuccess(res, 201, "Course created", course);
});

// @route   PUT /api/admin/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");

  const allowed = [
    "name",
    "description",
    "technologies",
    "roadmap",
    "duration",
    "fees",
    "code",
    "status",
  ];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) course[f] = req.body[f];
  });
  await course.save();

  return sendSuccess(res, 200, "Course updated", course);
});

// @route   DELETE /api/admin/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");

  await Trainer.updateMany({ courseIds: course._id }, { $pull: { courseIds: course._id } });
  await Student.updateMany({ courseId: course._id }, { $unset: { courseId: "" } });
  await course.deleteOne();

  return sendSuccess(res, 200, "Course deleted", null);
});

// @route   PATCH /api/admin/courses/:id/assign-trainer    body: { trainerId }  (Trainer profile _id)
const assignTrainer = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");
  if (!req.body.trainerId) throw new ApiError(400, "trainerId is required");

  await assignTrainerToCourse(course, req.body.trainerId);
  return sendSuccess(res, 200, "Trainer assigned to course", course);
});

// @route   PATCH /api/admin/courses/:id/enroll    body: { studentId }  (Student profile _id)
const enrollStudent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");

  const student = await Student.findByIdAndUpdate(
    req.body.studentId,
    { courseId: course._id },
    { new: true }
  );
  if (!student) throw new ApiError(404, "Student not found");

  return sendSuccess(res, 200, "Student enrolled", student);
});

// @route   PATCH /api/admin/courses/:id/unenroll    body: { studentId }
const unenrollStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.body.studentId, courseId: req.params.id },
    { $unset: { courseId: "" } },
    { new: true }
  );
  if (!student) throw new ApiError(404, "Student not found in this course");

  return sendSuccess(res, 200, "Student removed from course", student);
});

module.exports = {
  getDashboardStats,
  getTrainers,
  getTrainerById,
  approveTrainer,
  rejectTrainer,
  getStudents,
  getStudentById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getAdmins,
  createAdmin,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  assignTrainer,
  enrollStudent,
  unenrollStudent,
};