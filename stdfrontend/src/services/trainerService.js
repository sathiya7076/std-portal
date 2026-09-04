import api from './api'

const extractData = (payload) => {
  if (payload?.data !== undefined) return payload.data
  return payload
}

const trainerService = {
  async getProfile() {
    const { data } = await api.get('/trainer/profile')
    return extractData(data)
  },

  async updateProfile(payload) {
    // Backend only accepts phone, experience, specialization —
    // email lives on the User model and isn't updatable via this route.
    const { data } = await api.put('/trainer/profile', payload)
    return extractData(data)
  },
}

export default trainerService