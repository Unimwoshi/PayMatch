import Notification from '../models/Notification.js'

const notify = async (userId, { title, message, type = 'general', link = null }) => {
  try {
    await Notification.create({ user: userId, title, message, type, link })
  } catch (error) {
    console.error('Notification error:', error.message)
  }
}

export default notify