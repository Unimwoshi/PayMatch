import Notification from '../models/Notification.js'

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true })
    res.json({ message: 'Marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    )
    res.json({ message: 'All marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ message: 'Notification deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id })
    res.json({ message: 'All notifications cleared' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}