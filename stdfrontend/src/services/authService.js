import api from './api'

const authService = {
  async login({ id, password }) {
    const { data } = await api.post('/auth/login', {
      email: id,
      password,
    })
    return data.data // { token, user: { id, name, email, role } }
  },

  // CONFIRMED (via authController.js): registering a student auto-creates
  // a linked Student document. Response is:
  // { token, user: { id, name, email, role }, profile: { _id, userId,
  //   studentId, courseId, phone, ... } }
  // profile._id is the real Mongo ID to use for all /students/:id calls.
  // profile.studentId is a backend-AUTO-GENERATED display code (e.g.
  // "STU-LX7K9F") — the backend does not accept a custom Student ID at
  // registration time.
  async register({ name, email, password, role, phone }) {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
      phone,
    })
    return data.data // { token, user, profile }
  },

  async logout() {
    return Promise.resolve({ success: true })
  },

  async forgotPassword(email) {
    throw {
      response: {
        data: {
          message:
            'Password reset is not available yet. Please contact your trainer/admin.',
        },
      },
    }
  },
}

export default authService