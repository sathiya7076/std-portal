// ============================================================
// Mock data — stands in for the future Node/Express/MongoDB API.
// Every service function returns a Promise so swapping in real
// Axios calls later requires no change to component code.
// ============================================================

export const mockUsers = {
  student: {
    id: 'STU001',
    role: 'student',
    name: 'Sathiya Moorthy',
    email: 'sathiya@stms.edu',
    phone: '+91 98765 43210',
    address: 'Madurai, Tamil Nadu',
    course: 'Full Stack Development',
    joiningDate: '2026-01-12',
    fingerprintRegistered: true,
  },
  trainer: {
    id: 'TRN001',
    role: 'trainer',
    name: 'Mr. Kumar',
    email: 'kumar@stms.edu',
    phone: '+91 90000 11223',
    course: 'Full Stack Development',
    experience: '3 Years',
    specialization: ['React.js', 'Node.js', 'MongoDB'],
  },
}

export const mockCourses = [
  {
    id: 'c1',
    name: 'Full Stack Development',
    description: 'Build end-to-end web applications with modern JavaScript tooling.',
    icon: 'bi-code-slash',
    duration: '6 Months',
    fees: 45000,
    trainer: 'Mr. Kumar',
    students: 42,
    status: 'Ongoing',
    technologies: ['HTML', 'CSS', 'JavaScript', 'React.js', 'Node.js', 'Express.js', 'MongoDB'],
    roadmap: ['HTML & CSS', 'JavaScript', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'Full Stack Project'],
  },
  {
    id: 'c2',
    name: 'Digital Marketing',
    description: 'SEO, social media, and campaign analytics for modern brands.',
    icon: 'bi-megaphone',
    duration: '3 Months',
    fees: 22000,
    trainer: 'Ms. Priya',
    students: 30,
    status: 'Ongoing',
    technologies: ['SEO', 'Google Ads', 'Analytics', 'Content Strategy', 'Social Media'],
    roadmap: ['Marketing Basics', 'SEO', 'Social Media', 'Paid Ads', 'Analytics', 'Capstone Campaign'],
  },
  {
    id: 'c3',
    name: 'Data Analytics',
    description: 'Turn raw data into decisions using Python, SQL, and visualization.',
    icon: 'bi-bar-chart-line',
    duration: '4 Months',
    fees: 35000,
    trainer: 'Mr. Arjun',
    students: 26,
    status: 'Ongoing',
    technologies: ['Excel', 'SQL', 'Python', 'Pandas', 'Power BI'],
    roadmap: ['Excel', 'SQL', 'Python', 'Pandas', 'Power BI', 'Capstone Dashboard'],
  },
  {
    id: 'c4',
    name: 'UI / UX Design',
    description: 'Design usable, accessible interfaces from research to prototype.',
    icon: 'bi-palette',
    duration: '3 Months',
    fees: 25000,
    trainer: 'Ms. Divya',
    students: 18,
    status: 'New',
    technologies: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    roadmap: ['Design Basics', 'Wireframing', 'Figma', 'Prototyping', 'Usability Testing', 'Portfolio Project'],
  },
]

export const mockAttendance = {
  totalWorkingDays: 120,
  present: 105,
  absent: 15,
  percentage: 87.5,
}

export const mockLearningProgress = [
  { skill: 'HTML', percent: 100 },
  { skill: 'CSS', percent: 90 },
  { skill: 'JavaScript', percent: 80 },
  { skill: 'React', percent: 70 },
  { skill: 'Node.js', percent: 50 },
]

export const mockMaterials = {
  c1: [
    { id: 'm1', title: 'HTML Notes.pdf', format: 'pdf', uploadedDate: '2026-02-01' },
    { id: 'm2', title: 'HTML Tutorial.mp4', format: 'video', uploadedDate: '2026-02-01' },
    { id: 'm3', title: 'CSS Flexbox Guide.pdf', format: 'pdf', uploadedDate: '2026-02-10' },
    { id: 'm4', title: 'React Hooks Deep Dive.mp4', format: 'video', uploadedDate: '2026-03-05' },
  ],
  c2: [
    { id: 'm5', title: 'SEO Fundamentals.pdf', format: 'pdf', uploadedDate: '2026-02-15' },
    { id: 'm6', title: 'Google Ads Walkthrough.mp4', format: 'video', uploadedDate: '2026-02-20' },
  ],
  c3: [
    { id: 'm7', title: 'SQL Joins Cheatsheet.pdf', format: 'pdf', uploadedDate: '2026-02-18' },
  ],
  c4: [
    { id: 'm8', title: 'Figma Basics.mp4', format: 'video', uploadedDate: '2026-03-01' },
  ],
}

export const mockTasks = [
  {
    id: 't1',
    title: 'Build a Responsive Landing Page',
    description: 'Create a fully responsive landing page using HTML, CSS and Bootstrap grid.',
    course: 'Full Stack Development',
    assignedDate: '2026-08-10',
    dueDate: '2026-08-20',
    status: 'Completed',
    score: 92,
    feedback: 'Clean layout, good use of grid. Improve mobile spacing.',
    submission: { githubUrl: 'https://github.com/example/landing-page' },
  },
  {
    id: 't2',
    title: 'React Todo App',
    description: 'Implement a todo app with add/edit/delete using React hooks.',
    course: 'Full Stack Development',
    assignedDate: '2026-08-15',
    dueDate: '2026-08-25',
    status: 'Completed',
    score: 88,
    feedback: 'Good state management. Add empty-state handling next time.',
    submission: { githubUrl: 'https://github.com/example/react-todo' },
  },
  {
    id: 't3',
    title: 'Express REST API for Notes',
    description: 'Build CRUD REST endpoints for a notes resource using Express.',
    course: 'Full Stack Development',
    assignedDate: '2026-08-20',
    dueDate: '2026-08-30',
    status: 'Pending',
    score: null,
    feedback: '',
    submission: null,
  },
  {
    id: 't4',
    title: 'MongoDB Schema Design',
    description: 'Design normalized schemas for a mini e-commerce data model.',
    course: 'Full Stack Development',
    assignedDate: '2026-08-22',
    dueDate: '2026-09-02',
    status: 'Pending',
    score: null,
    feedback: '',
    submission: null,
  },
  {
    id: 't5',
    title: 'Full Stack Capstone — Phase 1',
    description: 'Submit the project proposal and wireframes for your capstone project.',
    course: 'Full Stack Development',
    assignedDate: '2026-08-25',
    dueDate: '2026-09-05',
    status: 'Pending',
    score: null,
    feedback: '',
    submission: null,
  },
]

export const mockFees = {
  totalFees: 45000,
  paidAmount: 30000,
  pendingAmount: 15000,
  status: 'Partially Paid',
  history: [
    { date: '2026-01-15', amount: 15000, status: 'Paid', receiptId: 'RCPT-1001' },
    { date: '2026-04-15', amount: 15000, status: 'Paid', receiptId: 'RCPT-1045' },
    { date: '2026-08-15', amount: 15000, status: 'Due', receiptId: null },
  ],
}

export const mockNotifications = [
  { id: 'n1', type: 'task', icon: 'bi-clipboard-check', title: 'New Task Assigned', message: 'Express REST API for Notes has been assigned to you.', date: '2026-08-20 09:15 AM', read: false },
  { id: 'n2', type: 'attendance-present', icon: 'bi-check-circle', title: 'Attendance Marked', message: 'You were marked present today.', date: '2026-08-29 09:05 AM', read: false },
  { id: 'n3', type: 'material', icon: 'bi-file-earmark-arrow-down', title: 'New Study Material', message: 'React Hooks Deep Dive.mp4 was added to your course.', date: '2026-08-28 04:30 PM', read: false },
  { id: 'n4', type: 'attendance-absent', icon: 'bi-x-circle', title: 'Attendance — Absent', message: 'You were marked absent on 2026-08-18.', date: '2026-08-18 09:00 AM', read: true },
  { id: 'n5', type: 'course', icon: 'bi-mortarboard', title: 'New Course Available', message: 'UI / UX Design batch is now open for enrollment.', date: '2026-08-12 11:00 AM', read: true },
  { id: 'n6', type: 'late', icon: 'bi-clock-history', title: 'Late Arrival', message: 'You checked in 20 minutes late on 2026-08-11.', date: '2026-08-11 09:20 AM', read: true },
]

export const mockStudents = [
  { id: 'STU001', name: 'Sathiya Moorthy', course: 'Full Stack Development', attendance: 87.5, progress: 78, email: 'sathiya@stms.edu', phone: '+91 98765 43210', address: 'Madurai, Tamil Nadu' },
  { id: 'STU002', name: 'Anitha Raj', course: 'Full Stack Development', attendance: 94.2, progress: 85, email: 'anitha@stms.edu', phone: '+91 98765 43211', address: 'Chennai, Tamil Nadu' },
  { id: 'STU003', name: 'Vignesh Kumar', course: 'Digital Marketing', attendance: 78.0, progress: 60, email: 'vignesh@stms.edu', phone: '+91 98765 43212', address: 'Coimbatore, Tamil Nadu' },
  { id: 'STU004', name: 'Deepika S', course: 'Data Analytics', attendance: 91.0, progress: 72, email: 'deepika@stms.edu', phone: '+91 98765 43213', address: 'Trichy, Tamil Nadu' },
  { id: 'STU005', name: 'Rahul Nair', course: 'UI / UX Design', attendance: 82.4, progress: 55, email: 'rahul@stms.edu', phone: '+91 98765 43214', address: 'Kochi, Kerala' },
  { id: 'STU006', name: 'Priyanka M', course: 'Full Stack Development', attendance: 88.9, progress: 66, email: 'priyanka@stms.edu', phone: '+91 98765 43215', address: 'Salem, Tamil Nadu' },
  { id: 'STU007', name: 'Karthik B', course: 'Data Analytics', attendance: 75.5, progress: 48, email: 'karthik@stms.edu', phone: '+91 98765 43216', address: 'Madurai, Tamil Nadu' },
]
