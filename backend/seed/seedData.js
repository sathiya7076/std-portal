/**
 * Seeds the database with sample data:
 * - 1 trainer
 * - 5 students
 * - 4 courses
 * - Attendance, Tasks, Materials, Fees, Payments, Notifications
 *
 * Usage:
 *   node seed/seedData.js            -> seed data
 *   node seed/seedData.js --destroy  -> wipe all collections
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Student = require("../models/Student");
const Trainer = require("../models/Trainer");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Task = require("../models/Task");
const TaskSubmission = require("../models/TaskSubmission");
const Material = require("../models/Material");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const FingerprintRegistration = require("../models/FingerprintRegistration");

const COURSE_DEFS = [
  {
    name: "Full Stack Development",
    description: "Become a full stack web developer from scratch.",
    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
    ],
    roadmap: "Frontend basics -> React -> Node/Express -> MongoDB -> Deployment",
    duration: "6 Months",
    fees: 45000,
  },
  {
    name: "Digital Marketing",
    description: "Master SEO, SEM, and social media marketing.",
    technologies: ["SEO", "Google Ads", "Social Media", "Analytics"],
    roadmap: "Marketing basics -> SEO -> Paid Ads -> Analytics -> Strategy",
    duration: "3 Months",
    fees: 25000,
  },
  {
    name: "Data Analytics",
    description: "Learn to analyze and visualize data for decision-making.",
    technologies: ["Excel", "SQL", "Python", "Power BI", "Tableau"],
    roadmap: "Excel -> SQL -> Python -> Visualization -> Capstone",
    duration: "4 Months",
    fees: 35000,
  },
  {
    name: "UI / UX Design",
    description: "Design beautiful and usable digital products.",
    technologies: ["Figma", "Wireframing", "Prototyping", "User Research"],
    roadmap: "Design basics -> Wireframes -> Prototyping -> User Testing",
    duration: "3 Months",
    fees: 28000,
  },
];

const STUDENT_DEFS = [
  { name: "Aarav Sharma", email: "aarav.sharma@example.com" },
  { name: "Priya Patel", email: "priya.patel@example.com" },
  { name: "Rohan Mehta", email: "rohan.mehta@example.com" },
  { name: "Sneha Reddy", email: "sneha.reddy@example.com" },
  { name: "Kabir Singh", email: "kabir.singh@example.com" },
];

const DEFAULT_PASSWORD = "Password@123";

const generateShortId = (prefix, i) => `${prefix}-${String(i).padStart(4, "0")}`;

const destroy = async () => {
  await Promise.all([
    User.deleteMany(),
    Student.deleteMany(),
    Trainer.deleteMany(),
    Course.deleteMany(),
    Attendance.deleteMany(),
    Task.deleteMany(),
    TaskSubmission.deleteMany(),
    Material.deleteMany(),
    Fee.deleteMany(),
    Payment.deleteMany(),
    Notification.deleteMany(),
    FingerprintRegistration.deleteMany(),
  ]);
  console.log("All collections cleared.");
};

const seed = async () => {
  await destroy();

  // --- Trainer ---
  const trainerUser = await User.create({
    name: "Dr. Ananya Iyer",
    email: "trainer@example.com",
    password: DEFAULT_PASSWORD,
    role: "trainer",
  });

  const trainer = await Trainer.create({
    userId: trainerUser._id,
    trainerId: generateShortId("TRN", 1),
    experience: 8,
    specialization: "Full Stack Development & Cloud Architecture",
    phone: "9876500000",
    courseIds: [],
  });

  // --- Courses ---
  const courses = [];
  for (const def of COURSE_DEFS) {
    const course = await Course.create({
      ...def,
      trainerId: trainer._id,
      status: "active",
    });
    courses.push(course);
  }
  trainer.courseIds = courses.map((c) => c._id);
  await trainer.save();

  // --- Students ---
  const students = [];
  for (let i = 0; i < STUDENT_DEFS.length; i++) {
    const def = STUDENT_DEFS[i];
    const user = await User.create({
      name: def.name,
      email: def.email,
      password: DEFAULT_PASSWORD,
      role: "student",
    });

    const student = await Student.create({
      userId: user._id,
      studentId: generateShortId("STU", i + 1),
      courseId: courses[i % courses.length]._id,
      phone: `98765${String(10000 + i).slice(-5)}`,
      address: `${i + 1} MG Road, Bengaluru`,
      joiningDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      learningProgress: [78, 45, 92, 60, 33][i],
    });
    students.push(student);

    await FingerprintRegistration.create({
      studentId: student._id,
      status: "registered",
      registeredAt: new Date(),
    });
  }

  // --- Attendance (last 5 working days for each student) ---
  const statusCycle = ["present", "present", "late", "absent", "present"];
  for (const student of students) {
    for (let d = 0; d < 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);

      await Attendance.create({
        studentId: student._id,
        date,
        status: statusCycle[(d + students.indexOf(student)) % statusCycle.length],
        checkInTime: date,
      });
    }
  }

  // --- Tasks + Submissions ---
  for (const course of courses) {
    const studentsInCourse = students.filter(
      (s) => s.courseId.toString() === course._id.toString()
    );
    if (studentsInCourse.length === 0) continue;

    const task = await Task.create({
      title: `${course.name} - Milestone 1`,
      description: `Complete the first milestone project for ${course.name}.`,
      courseId: course._id,
      assignedTo: studentsInCourse.map((s) => s._id),
      createdBy: trainer._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
    });

    // First student in course submits, gets evaluated
    const submitter = studentsInCourse[0];
    await TaskSubmission.create({
      taskId: task._id,
      studentId: submitter._id,
      githubUrl: "https://github.com/example/milestone-1",
      description: "Completed milestone 1 as instructed.",
      score: 88,
      feedback: "Great work, minor improvements needed on styling.",
      status: "evaluated",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      evaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });
  }

  // --- Materials ---
  for (const course of courses) {
    await Material.create({
      title: `${course.name} - Introduction Slides`,
      description: `Introductory material for ${course.name}.`,
      courseId: course._id,
      type: "PDF",
      fileUrl: "/uploads/materials/sample-placeholder.pdf",
      uploadedBy: trainer._id,
    });
  }

  // --- Fees + Payments ---
  for (const student of students) {
    const course = courses.find(
      (c) => c._id.toString() === student.courseId.toString()
    );
    const fee = await Fee.create({
      studentId: student._id,
      courseId: course._id,
      totalFees: course.fees,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const paymentAmount = Math.round(course.fees * 0.4);
    await Payment.create({
      studentId: student._id,
      feeId: fee._id,
      amount: paymentAmount,
      method: "upi",
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });
    fee.paidAmount = paymentAmount;
    await fee.save();
  }

  // --- Notifications ---
  for (const student of students) {
    const user = await User.findById(student.userId);
    await Notification.create({
      userId: user._id,
      type: "announcement",
      title: "Welcome to Smart Training Management System",
      message: "Your account has been set up successfully. Good luck!",
      isRead: false,
    });
  }

  console.log("Seed data created successfully.");
  console.log(`Trainer login: trainer@example.com / ${DEFAULT_PASSWORD}`);
  console.log("Student logins:");
  STUDENT_DEFS.forEach((s) => console.log(`  ${s.email} / ${DEFAULT_PASSWORD}`));
};

const run = async () => {
  await connectDB();

  if (process.argv.includes("--destroy")) {
    await destroy();
  } else {
    await seed();
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
