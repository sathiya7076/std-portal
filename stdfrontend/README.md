# Smart Training Management System — Frontend

A frontend-only React + Bootstrap 5 application for a training institute / LMS,
built for a BCA capstone project. Two roles — **Student** and **Trainer** — each
get a full dashboard experience. All data currently comes from an in-memory
mock service layer that mirrors the shape of a future REST API, so the app is
ready to plug into a Node.js + Express.js + MongoDB backend without touching
component code.

## Tech stack

- React 18 + Vite
- React Router DOM v6
- Bootstrap 5 + Bootstrap Icons
- Axios (configured, currently backed by mock data)
- Context API for authentication

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Log in from `/login` as either a
**Student** or **Trainer** — the mock auth service accepts any ID with a
password of 4+ characters.

```bash
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```

## Connecting a real backend

1. Set `VITE_API_URL` in `.env` to your Express API base URL
   (defaults to `http://localhost:5000/api`).
2. In each file under `src/services/`, flip `USE_MOCK` to `false`.
   Every function already calls the matching Axios endpoint in the
   `else` branch, so no component changes are needed.
3. Point your Express routes at the same shapes used in
   `src/mock/mockData.js` to keep the UI working unchanged.

## Project structure

```
src/
├── components/        Reusable UI: Navbar, Sidebar, cards, modals, states
├── context/            AuthContext (login/logout, current user)
├── mock/               mockData.js — stand-in for backend responses
├── pages/
│   ├── Login.jsx
│   ├── student/        7 student modules + dashboard
│   └── trainer/        5 trainer modules + dashboard
├── services/           Axios service layer (api, auth, student, course,
│                       task, material, fee, notification)
├── App.jsx             Route definitions
├── main.jsx            App entry point
└── index.css           Design tokens & global styles
```

## Routes

```
/login

/student/dashboard
/student/register
/student/courses
/student/courses/my-course
/student/courses/:id
/student/materials
/student/materials/:courseId
/student/tasks
/student/tasks/:id
/student/fees
/student/profile
/student/notifications

/trainer/dashboard
/trainer/students
/trainer/students/add
/trainer/students/:id
/trainer/courses
/trainer/tasks
/trainer/materials
/trainer/profile
```

## Notes

- Fingerprint registration is a **visual simulation only** — no biometric
  hardware integration.
- Login persists to `localStorage`; protected routes redirect to `/login`
  when there's no session, and to the correct role's dashboard if a
  student tries to open a trainer route (or vice versa).
- All forms include client-side validation, loading states, and empty/error
  states per screen.
