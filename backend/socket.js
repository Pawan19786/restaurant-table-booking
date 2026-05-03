// socket.js  — attach to your existing http server in server.js / index.js
// Usage:
//   import { initSocket, getIO } from "./socket.js";
//   const httpServer = createServer(app);
//   initSocket(httpServer);
//
// Then anywhere in controllers:
//   import { getIO } from "../socket.js";
//   getIO().to(`user_${userId}`).emit("notification", payload);

import { Server } from "socket.io";
import Notification from "./models/Notification.model.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || "http://localhost:5173",
      methods:     ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Client sends their userId after connecting so we can address them
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`Socket: user ${userId} joined their room`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket first.");
  return io;
};

// ── Notification helpers (call from controllers) ──────────────

export const notifyUser = async (userId, payload) => {
  try {
    // Save to DB
    let notification;
    if (payload.saveToDb !== false) {
      notification = await Notification.create({
        userId,
        title: payload.title || "Notification",
        message: payload.message || "You have a new notification",
        type: payload.type || "system",
      });
    }

    getIO().to(`user_${userId}`).emit("notification", {
      ...payload,
      _id: notification ? notification._id : undefined,
      createdAt: notification ? notification.createdAt : new Date().toISOString(),
    });
  } catch (e) {
    console.error("Socket notify error:", e.message);
  }
};

export const notifyOwner = (ownerId, payload) => {
  notifyUser(ownerId, payload);
};