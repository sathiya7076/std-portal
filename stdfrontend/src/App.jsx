import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentRegister from './pages/student/StudentRegister'
import StudentCourses from './pages/student/StudentCourses'
import CourseDetails from './pages/student/CourseDetails'
import MyCourse from './pages/student/MyCourse'
import StudentMaterials from './pages/student/StudentMaterials'
import MaterialsByCourse from './pages/student/MaterialsByCourse'
import StudentTasks from './pages/student/StudentTasks'
import TaskDetails from './pages/student/TaskDetails'
import StudentFees from './pages/student/StudentFees'
import StudentProfile from './pages/student/StudentProfile'
import StudentNotifications from './pages/student/StudentNotifications'

import TrainerDashboard from './pages/trainer/TrainerDashboard'
import TrainerStudents from './pages/trainer/TrainerStudents'
import AddStudent from './pages/trainer/AddStudent'
import TrainerStudentDetail from './pages/trainer/TrainerStudentDetail'
import TrainerCourses from './pages/trainer/TrainerCourses'
import TrainerTasks from './pages/trainer/TrainerTasks'
import TrainerMaterials from './pages/trainer/TrainerMaterials'
import TrainerProfile from './pages/trainer/TrainerProfile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/register" element={<ProtectedRoute role="student"><StudentRegister /></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute role="student"><StudentCourses /></ProtectedRoute>} />
      <Route path="/student/courses/my-course" element={<ProtectedRoute role="student"><MyCourse /></ProtectedRoute>} />
      <Route path="/student/courses/:id" element={<ProtectedRoute role="student"><CourseDetails /></ProtectedRoute>} />
      <Route path="/student/materials" element={<ProtectedRoute role="student"><StudentMaterials /></ProtectedRoute>} />
      <Route path="/student/materials/:courseId" element={<ProtectedRoute role="student"><MaterialsByCourse /></ProtectedRoute>} />
      <Route path="/student/tasks" element={<ProtectedRoute role="student"><StudentTasks /></ProtectedRoute>} />
      <Route path="/student/tasks/:id" element={<ProtectedRoute role="student"><TaskDetails /></ProtectedRoute>} />
      <Route path="/student/fees" element={<ProtectedRoute role="student"><StudentFees /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute role="student"><StudentNotifications /></ProtectedRoute>} />

      {/* Trainer routes */}
      <Route path="/trainer/dashboard" element={<ProtectedRoute role="trainer"><TrainerDashboard /></ProtectedRoute>} />
      <Route path="/trainer/students" element={<ProtectedRoute role="trainer"><TrainerStudents /></ProtectedRoute>} />
      <Route path="/trainer/students/add" element={<ProtectedRoute role="trainer"><AddStudent /></ProtectedRoute>} />
      <Route path="/trainer/students/:id" element={<ProtectedRoute role="trainer"><TrainerStudentDetail /></ProtectedRoute>} />
      <Route path="/trainer/courses" element={<ProtectedRoute role="trainer"><TrainerCourses /></ProtectedRoute>} />
      <Route path="/trainer/tasks" element={<ProtectedRoute role="trainer"><TrainerTasks /></ProtectedRoute>} />
      <Route path="/trainer/materials" element={<ProtectedRoute role="trainer"><TrainerMaterials /></ProtectedRoute>} />
      <Route path="/trainer/profile" element={<ProtectedRoute role="trainer"><TrainerProfile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}