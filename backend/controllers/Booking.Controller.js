import Booking from "../models/Booking.model.js";
import Restaurant from "../models/restaurant.model.js";
import nodemailer from "nodemailer";
import { notifyUser, notifyOwner } from "../socket.js";

// ── Mailer ───────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"TableTime 🍽️" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

// ── Email templates ───────────────────────────────────────────────────────────
const emailTemplates = {
  booking_created: (booking) => ({
    subject: `📋 Booking Received — ${booking.restaurant?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f1117;color:#f0ece4;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1a1f2e,#252b3b);padding:28px 32px">
          <h2 style="margin:0;font-size:22px;color:#fbbf24">Booking Received! ⏳</h2>
          <p style="margin:8px 0 0;color:rgba(240,236,228,0.5);font-size:13px">We've received your booking request</p>
        </div>
        <div style="padding:28px 32px">
          <p style="font-size:15px;margin:0 0 20px">Hi <strong>${booking.user?.name}</strong>,</p>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;margin-bottom:20px">
            <p style="margin:0 0 8px;font-size:13px;color:rgba(240,236,228,0.5)">BOOKING DETAILS</p>
            <p style="margin:4px 0;font-size:14px">🏠 <strong>${booking.restaurant?.name}</strong> — ${booking.restaurant?.city}</p>
            <p style="margin:4px 0;font-size:14px">📅 ${new Date(booking.date).toDateString()}</p>
            ${booking.orderType === "table" ? `<p style="margin:4px 0;font-size:14px">🕐 ${booking.timeSlot}</p><p style="margin:4px 0;font-size:14px">👥 ${booking.guests} guests</p>` : `<p style="margin:4px 0;font-size:14px">🛵 Delivery Order (₹${booking.totalAmount})</p>`}
          </div>
          <p style="font-size:13px;color:rgba(240,236,228,0.45)">The restaurant will confirm your booking shortly. You'll receive another email once confirmed.</p>
          <a href="${process.env.CLIENT_URL}/my-bookings" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#fbbf24;color:#0f1117;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">View My Bookings →</a>
        </div>
      </div>`,
  }),

  booking_confirmed: (booking) => ({
    subject: `✅ Booking Confirmed — ${booking.restaurant?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f1117;color:#f0ece4;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:28px 32px">
          <h2 style="margin:0;font-size:22px;color:#10b981">Booking Confirmed! ✅</h2>
          <p style="margin:8px 0 0;color:rgba(240,236,228,0.5);font-size:13px">Your table is reserved</p>
        </div>
        <div style="padding:28px 32px">
          <p style="font-size:15px;margin:0 0 20px">Great news, <strong>${booking.user?.name}</strong>!</p>
          <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px 20px;margin-bottom:20px">
            <p style="margin:4px 0;font-size:14px">🏠 <strong>${booking.restaurant?.name}</strong> — ${booking.restaurant?.city}</p>
            <p style="margin:4px 0;font-size:14px">📅 ${new Date(booking.date).toDateString()}</p>
            ${booking.orderType === "table" ? `<p style="margin:4px 0;font-size:14px">🕐 ${booking.timeSlot}</p><p style="margin:4px 0;font-size:14px">👥 ${booking.guests} guests</p>` : ""}
          </div>
          <a href="${process.env.CLIENT_URL}/my-bookings" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">View My Bookings →</a>
        </div>
      </div>`,
  }),

  booking_rejected: (booking) => ({
    subject: `❌ Booking Rejected — ${booking.restaurant?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f1117;color:#f0ece4;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#450a0a,#7f1d1d);padding:28px 32px">
          <h2 style="margin:0;font-size:22px;color:#f87171">Booking Rejected ❌</h2>
        </div>
        <div style="padding:28px 32px">
          <p style="font-size:15px;margin:0 0 16px">Hi <strong>${booking.user?.name}</strong>, unfortunately your booking was rejected.</p>
          ${booking.rejectionReason ? `<div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 18px;margin-bottom:16px"><p style="margin:0;font-size:13px;color:#f87171">Reason: ${booking.rejectionReason}</p></div>` : ""}
          <a href="${process.env.CLIENT_URL}/restaurants" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Browse Other Restaurants →</a>
        </div>
      </div>`,
  }),

  booking_preparing: (booking) => ({
    subject: `👨‍🍳 Your Order is Being Prepared — ${booking.restaurant?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f1117;color:#f0ece4;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:28px 32px">
          <h2 style="margin:0;font-size:22px;color:#60a5fa">Order Being Prepared 👨‍🍳</h2>
        </div>
        <div style="padding:28px 32px">
          <p>Hi <strong>${booking.user?.name}</strong>, your order from <strong>${booking.restaurant?.name}</strong> is now being prepared!</p>
          <a href="${process.env.CLIENT_URL}/my-bookings" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Track Order →</a>
        </div>
      </div>`,
  }),

  booking_out_for_delivery: (booking) => ({
    subject: `🛵 Order Out for Delivery — ${booking.restaurant?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f1117;color:#f0ece4;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#3b0764,#6d28d9);padding:28px 32px">
          <h2 style="margin:0;font-size:22px;color:#c4b5fd">Out for Delivery 🛵</h2>
        </div>
        <div style="padding:28px 32px">
          <p>Hi <strong>${booking.user?.name}</strong>! Your order from <strong>${booking.restaurant?.name}</strong> is on its way. Get ready!</p>
          <a href="${process.env.CLIENT_URL}/my-bookings" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Track Order →</a>
        </div>
      </div>`,
  }),

  booking_delivered: (booking) => ({
    subject: `🎉 Order Delivered — ${booking.restaurant?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f1117;color:#f0ece4;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#064e3b,#059669);padding:28px 32px">
          <h2 style="margin:0;font-size:22px;color:#6ee7b7">Delivered! 🎉</h2>
        </div>
        <div style="padding:28px 32px">
          <p>Hi <strong>${booking.user?.name}</strong>, your order from <strong>${booking.restaurant?.name}</strong> has been delivered. Enjoy your meal!</p>
          <p style="font-size:13px;color:rgba(240,236,228,0.45);margin-top:12px">Don't forget to leave a review!</p>
          <a href="${process.env.CLIENT_URL}/my-bookings" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Write a Review →</a>
        </div>
      </div>`,
  }),
};

// ── Socket notification messages ─────────────────────────────────────────────
const socketMessages = {
  confirmed: { title: "Booking Confirmed! ✅", message: "Your booking has been confirmed.", type: "success" },
  rejected: { title: "Booking Rejected ❌", message: "Your booking was rejected by the restaurant.", type: "error" },
  preparing: { title: "Order Being Prepared 👨‍🍳", message: "The restaurant is preparing your order.", type: "info" },
  out_for_delivery: { title: "Out for Delivery 🛵", message: "Your order is on the way!", type: "info" },
  delivered: { title: "Order Delivered 🎉", message: "Your food has been delivered. Enjoy!", type: "success" },
  cancelled: { title: "Booking Cancelled 🚫", message: "Your booking has been cancelled.", type: "warning" },
};

// ── Helper: generate time slots ──────────────────────────────
const generateTimeSlots = (openingTime, closingTime) => {
  const slots = [];
  const parseTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${m === 0 ? "00" : m} ${ampm}`;
  };
  const start = parseTime(openingTime) || 660;
  const end = parseTime(closingTime) || 1380;
  for (let t = start; t + 60 <= end; t += 60) {
    slots.push(`${formatTime(t)} - ${formatTime(t + 60)}`);
  }
  return slots;
};

// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const {
      restaurantId, date, timeSlot, guests, specialRequest,
      orderType, foodItems, deliveryDetails, totalAmount, paymentStatus,
    } = req.body;

    const isDeliveryOrder = orderType === "delivery" || (foodItems && foodItems.length > 0);

    if (!restaurantId || !date || (!isDeliveryOrder && (!timeSlot || !guests))) {
      return res.status(400).json({
        message: isDeliveryOrder
          ? "Restaurant and date are required"
          : "Restaurant, date, time slot and guests are required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!restaurant.isActive) return res.status(400).json({ message: "Restaurant is currently not accepting bookings" });

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) return res.status(400).json({ message: "Cannot book for a past date" });

    if (!isDeliveryOrder) {
      const existing = await Booking.findOne({
        user: req.user._id, restaurant: restaurantId,
        date: bookingDate, timeSlot,
        status: { $in: ["pending", "confirmed"] }, orderType: "table",
      });
      if (existing) return res.status(400).json({ message: "You already have a booking for this slot" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      restaurant: restaurantId,
      date: bookingDate,
      timeSlot: isDeliveryOrder ? "" : timeSlot,
      orderType: isDeliveryOrder ? "delivery" : "table",
      guests: isDeliveryOrder ? 1 : Number(guests),
      specialRequest: specialRequest || "",
      foodItems: foodItems || [],
      deliveryDetails: deliveryDetails || {},
      totalAmount: totalAmount || 0,
      paymentStatus: paymentStatus || "pending",
      status: "pending",
      ownerNotified: false,
      userNotified: false,
    });

    const populated = await Booking.findById(booking._id)
      .populate("restaurant", "name city address image addedBy")
      .populate("user", "name email");

    // ── Email: booking created ──
    const tmpl = emailTemplates.booking_created(populated);
    await sendMail(populated.user.email, tmpl.subject, tmpl.html);

    // ── Socket: notify owner of new booking ──
    if (populated.restaurant?.addedBy) {
      notifyOwner(populated.restaurant.addedBy.toString(), {
        title: "New Booking! 🔔",
        message: `${populated.user.name} booked a ${populated.orderType === "delivery" ? "delivery" : "table"} at ${populated.restaurant.name}`,
        type: "info",
        bookingId: booking._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: isDeliveryOrder ? "Delivery order created!" : "Booking created!",
      booking: populated,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("restaurant", "name city address image openingTime closingTime")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, bookings });
  } catch {
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

export const getOwnerBookings = async (req, res) => {
  try {
    const { status, date, orderType, restaurantId } = req.query;

    const restaurants = await Restaurant.find({ addedBy: req.user._id }).select("_id").lean();
    if (restaurants.length === 0) return res.status(404).json({ message: "No restaurants found for this owner" });

    const ownerResIds = restaurants.map(r => r._id.toString());
    let queryResIds = ownerResIds;
    if (restaurantId && restaurantId !== "all") {
      if (!ownerResIds.includes(restaurantId)) return res.status(403).json({ message: "Access denied" });
      queryResIds = [restaurantId];
    }

    const filter = { restaurant: { $in: queryResIds } };
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "name email picture")
      .populate("restaurant", "name city image")
      .sort({ createdAt: -1 })
      .lean();

    await Booking.updateMany({ restaurant: { $in: queryResIds }, ownerNotified: false }, { ownerNotified: true });

    return res.status(200).json({ success: true, bookings });
  } catch {
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

export const getOwnerBookingCount = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ addedBy: req.user._id }).select("_id").lean();
    if (restaurants.length === 0) return res.status(200).json({ count: 0 });
    const count = await Booking.countDocuments({
      restaurant: { $in: restaurants.map(r => r._id) }, status: "pending", ownerNotified: false,
    });
    return res.status(200).json({ success: true, count });
  } catch {
    return res.status(500).json({ message: "Failed to fetch count" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;

    const allowedStatuses = ["confirmed", "rejected", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const booking = await Booking.findById(bookingId).populate("restaurant", "addedBy name");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.restaurant.addedBy?.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === "superadmin";
    if (!isOwner && !isSuperAdmin)
      return res.status(403).json({ message: "Access denied" });

    if (booking.orderType === "table") {
      if (!["confirmed", "rejected", "cancelled"].includes(status))
        return res.status(400).json({ message: "Invalid table booking status" });
    }

    if (booking.orderType === "delivery") {
      const validTransitions = {
        pending: ["confirmed", "rejected", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["out_for_delivery", "cancelled"],
        out_for_delivery: ["delivered", "cancelled"],
        delivered: [], rejected: [], cancelled: [],
      };
      if (!validTransitions[booking.status]?.includes(status))
        return res.status(400).json({ message: `Cannot change from ${booking.status} to ${status}` });
    }

    booking.status = status;
    booking.rejectionReason = rejectionReason || "";
    booking.userNotified = false;
    await booking.save();

    const updated = await Booking.findById(bookingId)
      .populate("restaurant", "name city")
      .populate("user", "name email");

    // ── Email notification ──
    const tmplKey = `booking_${status}`;
    if (emailTemplates[tmplKey]) {
      const tmpl = emailTemplates[tmplKey](updated);
      await sendMail(updated.user.email, tmpl.subject, tmpl.html);
    }

    // ── Socket notification to user ──
    const socketMsg = socketMessages[status];
    if (socketMsg) {
      notifyUser(updated.user._id.toString(), {
        ...socketMsg,
        bookingId: booking._id,
        restaurant: updated.restaurant?.name,
      });
    }

    return res.status(200).json({ success: true, message: `Booking ${status}`, booking: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update booking" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });
    if (["cancelled", "rejected", "delivered"].includes(booking.status))
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = "user";
    await booking.save();

    return res.status(200).json({ success: true, message: "Booking cancelled" });
  } catch {
    return res.status(500).json({ message: "Failed to cancel booking" });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const allSlots = generateTimeSlots(restaurant.openingTime, restaurant.closingTime);
    const bookingDate = new Date(date);
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookedSlots = await Booking.find({
      restaurant: restaurantId,
      date: { $gte: bookingDate, $lt: nextDay },
      status: { $in: ["pending", "confirmed"] },
      orderType: { $ne: "delivery" },
    }).select("timeSlot").lean();

    const bookedSlotNames = bookedSlots.map((b) => b.timeSlot);
    const slots = allSlots.map((slot) => ({ slot, available: !bookedSlotNames.includes(slot) }));

    return res.status(200).json({ success: true, slots, restaurant: { name: restaurant.name } });
  } catch {
    return res.status(500).json({ message: "Failed to fetch slots" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, restaurantId, orderType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (restaurantId) filter.restaurant = restaurantId;
    if (orderType) filter.orderType = orderType;

    const bookings = await Booking.find(filter)
      .populate("restaurant", "name city")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, bookings });
  } catch {
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};