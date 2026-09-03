chang course cont

# Smart Training Management System — Backend

A production-style REST API backend for a training/LMS platform with two roles:
**student** and **trainer**. Built with Node.js, Express, MongoDB (Mongoose), JWT auth,
bcrypt password hashing, and Multer file uploads.

This is a **backend-only** project. It is designed to be consumed by a separate
React.js + Bootstrap frontend over REST APIs.

---
## Tech Stack

- Node.js + Express.js — REST API server
- MongoDB + Mongoose — database & ODM
- JWT (`jsonwebtoken`) — authentication
- bcrypt (`bcryptjs`) — password hashing
- Multer — file uploads (study materials, task submissions)
- PDFKit — PDF receipt generation
- dotenv, cors, morgan — config, CORS, request logging

---

## Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/                # Request handlers (business logic entry points)
├── middleware/
│   ├── authMiddleware.js       # JWT verification
│   ├── roleMiddleware.js       # requireRole("trainer" | "student")
│   ├── uploadMiddleware.js     # Multer config (materials + submissions)
│   ├── errorMiddleware.js      # Centralized error handler
│   └── notFoundMiddleware.js   # 404 handler
├── models/                     # Mongoose schemas
├── routes/                     # Express routers, mounted in server.js
├── services/                   # Reusable business logic (attendance %, fees, etc.)
├── utils/                      # ApiError, response helpers, JWT helper, pagination
├── uploads/
│   ├── materials/              # Uploaded study materials (PDF/video)
│   └── submissions/            # Uploaded task submission files
├── seed/
│   └── seedData.js             # Sample data seeder
├── .env.example
├── server.js                   # App entry point
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET` and your `MONGO_URI`.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/training_management
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 4. Seed sample data (optional but recommended)

```bash
npm run seed
```

This creates 1 trainer, 5 students, 4 courses, attendance, tasks, materials,
fees, payments, and notifications. Login credentials are printed to the console
after seeding (default password: `Password@123`).

To wipe all seeded data:

```bash
npm run seed:destroy
```

### 5. Run the server

```bash
npm run dev     # nodemon, auto-restart on changes
# or
npm start        # plain node
```

The API will be available at `http://localhost:5000/api`.
Health check: `GET http://localhost:5000/api/health`

---

## Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require a JWT
sent as a Bearer token:

```
Authorization: Bearer <token>
```

Tokens are issued at login/registration and encode `{ id, role }`.

---

## API Reference

Response shape (all endpoints):

```json
// success
{ "success": true, "message": "...", "data": {} }

// error
{ "success": false, "message": "..." }
```

List endpoints additionally return `meta: { total, page, limit, totalPages }`.

### Auth — `/api/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a student or trainer |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Private | Get current user + profile |

### Students (management) — `/api/students`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Trainer | List students (paginated, filter by `courseId`) |
| POST | `/` | Trainer | Create a student (creates User + Student) |
| GET | `/:id` | Trainer / Own | Get a student by id |
| PUT | `/:id` | Trainer | Update a student |
| DELETE | `/:id` | Trainer | Delete a student |
| GET | `/:id/progress` | Trainer / Own | Learning progress + attendance summary |

### Student self-service — `/api/student`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/profile` | Student | Own profile |
| PUT | `/profile` | Student | Update own profile (phone/address) |
| GET | `/dashboard` | Student | Dashboard summary |

### Trainer self-service — `/api/trainer`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/profile` | Trainer | Own profile |
| PUT | `/profile` | Trainer | Update own profile |
| GET | `/dashboard` | Trainer | Dashboard summary |

### Courses — `/api/courses`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Both | List courses (students see only active) |
| POST | `/` | Trainer | Create a course (notifies all students) |
| GET | `/:id` | Both | Get course details |
| PUT | `/:id` | Trainer (owner) | Update a course |
| DELETE | `/:id` | Trainer (owner) | Delete a course |

### Attendance — `/api/attendance`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Trainer | Mark attendance (present/absent/late) |
| GET | `/` | Trainer / Own | List records (filters: `studentId`, `from`, `to`) |
| GET | `/summary/:studentId` | Trainer / Own | Present/Absent/Late + percentage |

### Fingerprint (biometric simulation) — `/api/fingerprint`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Trainer | Register/simulate a student's fingerprint |
| GET | `/student/:studentId` | Trainer / Own | Get registration status |

> No raw biometric data is ever stored — only a generated reference id and status,
> so real hardware/SDK integration can be added later without schema changes.

### Tasks — `/api/tasks`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Both | Trainer: created tasks. Student: assigned tasks |
| POST | `/` | Trainer | Create + assign a task (notifies students) |
| GET | `/:id` | Both | Get task details |
| PUT | `/:id` | Trainer (owner) | Update a task |
| DELETE | `/:id` | Trainer (owner) | Delete a task |
| POST | `/:taskId/submit` | Student | Submit/resubmit (multipart: `file`, `githubUrl`, `description`) |
| GET | `/:taskId/submissions` | Trainer (owner) | List all submissions for a task |

### Submissions — `/api/submissions`
| Method | Route | Access | Description |
|---|---|---|---|
| PUT | `/:submissionId/evaluate` | Trainer | Score + feedback + status |

### Materials — `/api/materials`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Both | List materials (students filtered to own course) |
| POST | `/` | Trainer | Upload (multipart: `file`, `title`, `courseId`, `type`) |
| GET | `/:id` | Both | Get material details |
| PUT | `/:id` | Trainer (owner) | Update metadata / replace file |
| DELETE | `/:id` | Trainer (owner) | Delete material + file |

### Fees — `/api/fees`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/student/:studentId` | Trainer / Own | Fee records + pending amount |
| POST | `/` | Trainer | Create a fee record |
| PUT | `/:id` | Trainer | Update a fee record |

### Payments — `/api/payments`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Trainer | Record a payment against a fee |
| GET | `/:studentId` | Trainer / Own | Payment history |
| GET | `/:paymentId/receipt` | Trainer / Own | Download PDF receipt |

### Notifications — `/api/notifications`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Private | List (filters: `isRead`, `type`), includes `unreadCount` |
| POST | `/` | Trainer | Create a manual notification/announcement |
| PUT | `/:id/read` | Owner | Mark one as read |
| PUT | `/read-all` | Private | Mark all as read |
| DELETE | `/:id` | Owner | Delete a notification |

Automatic notifications are fired on: task creation, course creation, attendance
marked (present/absent/late), material upload, task submission, and evaluation.

---

## Security Notes

- Passwords are hashed with bcrypt and never returned in any API response.
- JWT is required on every route except register/login.
- Role-based guards (`requireRole`) restrict trainer-only vs student-only actions.
- Students can only access **their own** profile, attendance, fees, payments,
  submissions, and progress — enforced by comparing the authenticated user's id
  (from the JWT) against the resource owner, never trusting a client-supplied id
  for private resources.
- File uploads are restricted by MIME type and size (see `middleware/uploadMiddleware.js`).
- Duplicate attendance for the same student/day is prevented at the database
  level via a unique compound index.

---

## Seed Data Login Reference

After running `Password@123``:

- Trainer: `trainer@example.com` / `Password@123`
- Students: `aarav.sharma@example.com`, `priya.patel@example.com`,
  `rohan.mehta@example.com`, `sneha.reddy@example.com`, `kabir.singh@example.com`
  (all use `Password@123`)

---

## Notes for Frontend Integration

- Base URL: `http://localhost:5000/api` (configurable via `PORT`)
- CORS is restricted to `CLIENT_URL` from `.env` (default Vite port `5173`)
- Uploaded files are served statically at `/uploads/materials/...` and
  `/uploads/submissions/...`
- All list endpoints support `?page=&limit=` query params

new add