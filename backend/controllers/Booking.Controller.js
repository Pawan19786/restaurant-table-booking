import Booking    from "../models/Booking.model.js";
import Restaurant from "../models/Restaurant.model.js";

// ── Helper: generate time slots ──────────────────────────────
const generateTimeSlots = (openingTime, closingTime) => {
  const slots = [];
  const parseTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const formatTime = (minutes) => {
    const h   = Math.floor(minutes / 60);
    const m   = minutes % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${m === 0 ? "00" : m} ${ampm}`;
  };

  const start = parseTime(openingTime) || 660;  // default 11:00 AM
  const end   = parseTime(closingTime) || 1380; // default 11:00 PM

  for (let t = start; t + 60 <= end; t += 60) {
    slots.push(`${formatTime(t)} - ${formatTime(t + 60)}`);
  }
  return slots;
};

// ── CREATE booking ───────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const { restaurantId, date, timeSlot, guests, specialRequest } = req.body;

    if (!restaurantId || !date || !timeSlot || !guests)
      return res.status(400).json({ message: "Restaurant, date, time slot and guests are required" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });

    if (!restaurant.isActive)
      return res.status(400).json({ message: "Restaurant is currently not accepting bookings" });

    // Check date is not in past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today)
      return res.status(400).json({ message: "Cannot book for a past date" });

    // Check for double booking — same user, same restaurant, same date & slot
    const existing = await Booking.findOne({
      user:       req.user._id,
      restaurant: restaurantId,
      date:       bookingDate,
      timeSlot,
      status:     { $in: ["pending", "confirmed"] },
    });
    if (existing)
      return res.status(400).json({ message: "You already have a booking for this slot" });

    const booking = await Booking.create({
      user:           req.user._id,
      restaurant:     restaurantId,
      date:           bookingDate,
      timeSlot,
      guests:         Number(guests),
      specialRequest: specialRequest || "",
      status:         "pending",
      ownerNotified:  false,
      userNotified:   false,
    });

    const populated = await Booking.findById(booking._id)
      .populate("restaurant", "name city address image")
      .populate("user",       "name email");

    res.status(201).json({ success: true, message: "Booking created successfully!", booking: populated });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
};

// ── GET user's own bookings ───────────────────────────────────
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("restaurant", "name city address image openingTime closingTime")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ── GET owner's restaurant bookings ──────────────────────────
export const getOwnerBookings = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ addedBy: req.user._id });
    if (!restaurant)
      return res.status(404).json({ message: "No restaurant found for this owner" });

    const { status, date } = req.query;
    const filter = { restaurant: restaurant._id };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "name email picture")
      .sort({ date: 1, timeSlot: 1 });

    // Mark owner as notified
    await Booking.updateMany(
      { restaurant: restaurant._id, ownerNotified: false },
      { ownerNotified: true }
    );

    res.status(200).json({ success: true, bookings, restaurant: { name: restaurant.name } });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ── GET pending count for owner (for notification badge) ─────
export const getOwnerBookingCount = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ addedBy: req.user._id });
    if (!restaurant) return res.status(200).json({ count: 0 });

    const count = await Booking.countDocuments({
      restaurant:    restaurant._id,
      status:        "pending",
      ownerNotified: false,
    });

    res.status(200).json({ success: true, count });
  } catch {
    res.status(500).json({ message: "Failed to fetch count" });
  }
};

// ── UPDATE booking status (owner: confirm/reject) ────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["confirmed", "rejected"].includes(status))
      return res.status(400).json({ message: "Status must be confirmed or rejected" });

    const booking = await Booking.findById(bookingId)
      .populate("restaurant", "addedBy name");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    // Only owner of that restaurant can update
    const isOwner      = booking.restaurant.addedBy?.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === "superadmin";

    if (!isOwner && !isSuperAdmin)
      return res.status(403).json({ message: "Access denied" });

    if (booking.status !== "pending")
      return res.status(400).json({ message: "Can only update pending bookings" });

    booking.status          = status;
    booking.rejectionReason = rejectionReason || "";
    booking.userNotified    = false; // user needs to be notified
    await booking.save();

    const updated = await Booking.findById(bookingId)
      .populate("restaurant", "name city")
      .populate("user",       "name email");

    res.status(200).json({ success: true, message: `Booking ${status}`, booking: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking" });
  }
};

// ── CANCEL booking (user can cancel their own) ────────────────
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the user who booked can cancel
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    if (booking.status === "cancelled")
      return res.status(400).json({ message: "Booking already cancelled" });

    if (booking.status === "rejected")
      return res.status(400).json({ message: "Cannot cancel a rejected booking" });

    booking.status      = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = "user";
    await booking.save();

    res.status(200).json({ success: true, message: "Booking cancelled" });
  } catch {
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};

// ── GET available time slots for a restaurant on a date ───────
export const getAvailableSlots = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ message: "Date is required" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    // Generate all slots
    const allSlots = generateTimeSlots(restaurant.openingTime, restaurant.closingTime);

    // Find already booked slots for this date
    const bookingDate = new Date(date);
    const nextDay     = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookedSlots = await Booking.find({
      restaurant: restaurantId,
      date:       { $gte: bookingDate, $lt: nextDay },
      status:     { $in: ["pending", "confirmed"] },
    }).select("timeSlot");

    const bookedSlotNames = bookedSlots.map(b => b.timeSlot);

    const slots = allSlots.map(slot => ({
      slot,
      available: !bookedSlotNames.includes(slot),
    }));

    res.status(200).json({ success: true, slots, restaurant: { name: restaurant.name } });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch slots" });
  }
};

// ── GET all bookings (superadmin) ─────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    const { status, restaurantId } = req.query;
    const filter = {};
    if (status)       filter.status     = status;
    if (restaurantId) filter.restaurant = restaurantId;

    const bookings = await Booking.find(filter)
      .populate("restaurant", "name city")
      .populate("user",       "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};