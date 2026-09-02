import api from './api'

/**
 * Real backend-backed auth service.
 *
 * IMPORTANT: The previous version of this file had `USE_MOCK = true`,
 * which meant login never actually called the backend at all — it just
 * returned fake data from mockUsers. That's why nothing ever persisted:
 * the request never reached MongoDB in the first place. This version
 * always calls the real API.
 */
const authService = {
  // Login form sends { role, id, password }. The backend's login only
  // needs email + password (it looks up the user's real role itself),
  // so we send `id` as the email and ignore the UI's role toggle here —
  // the backend response tells us the user's actual role.
  async login({ id, password }) {
    const { data } = await api.post('/auth/login', {
      email: id,
      password,
    })
    return data.data // { token, user: { id, name, email, role } }
  },

  // This was completely missing before — Register.jsx called
  // authService.register(...) but it didn't exist anywhere, so
  // registration could never work regardless of the backend.
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
    // JWTs are stateless — there's no server-side session to invalidate,
    // so this just resolves. Token removal happens in AuthContext.
    return Promise.resolve({ success: true })
  },

  async forgotPassword(email) {
    // No backend endpoint for this yet (not in the current API spec).
    // Surface a clear message instead of silently pretending it worked.
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