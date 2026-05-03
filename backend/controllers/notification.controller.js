import Notification from "../models/Notification.model.js";

// Fetch notifications for the logged-in user
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark as read", error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all as read", error: error.message });
  }
};

import { dispatchNotification } from "../utils/notificationDispatcher.js";

// Notify on cart add
export const notifyCartAdd = async (req, res) => {
  try {
    const { itemName, restaurantName } = req.body;
    await dispatchNotification({
      userId: req.user._id.toString(),
      title: "Item added to cart 🛒",
      message: `You have selected ${itemName} from ${restaurantName}.`,
      type: "order"
    });
    res.status(200).json({ message: "Cart notification sent" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send cart notification", error: error.message });
  }
};
