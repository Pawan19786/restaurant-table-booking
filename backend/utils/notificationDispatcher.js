import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import sendEmail from "./sendEmail.js";
import { notifyUser } from "../socket.js";

/**
 * Dispatches a notification to a user:
 * 1. Saves to DB
 * 2. Emits via Socket.io
 * 3. Sends an Email
 */
export const dispatchNotification = async ({ userId, title, message, type = "system" }) => {
  try {
    // 1. Save to DB
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
    });

    // 2. Emit via Socket.io
    notifyUser(userId, {
      _id: notification._id,
      title,
      message,
      type,
      isRead: false,
      createdAt: notification.createdAt,
    });

    // 3. Send Email
    const user = await User.findById(userId);
    if (user && user.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #d97706; margin-bottom: 16px;">TableTime Notification</h2>
          <h3 style="color: #111827; margin-bottom: 8px;">${title}</h3>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated message from TableTime. Please do not reply.</p>
        </div>
      `;
      await sendEmail({
        to: user.email,
        subject: `TableTime: ${title}`,
        html: emailHtml,
      });
    }

    return notification;
  } catch (error) {
    console.error("Failed to dispatch notification:", error.message);
  }
};
