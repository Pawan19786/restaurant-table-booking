import Review     from "../models/review.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Booking    from "../models/Booking.model.js";

// ── POST /api/reviews  (create or update own review) ─────────
export const createOrUpdateReview = async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!restaurantId || !rating)
      return res.status(400).json({ message: "restaurantId and rating required" });

    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    // Check if user has a completed / confirmed booking at this restaurant
    const verifiedBooking = await Booking.findOne({
      user:       userId,
      restaurant: restaurantId,
      status:     { $in: ["confirmed", "delivered"] },
    });

    const existing = await Review.findOne({ user: userId, restaurant: restaurantId });

    let review;
    if (existing) {
      existing.rating    = rating;
      existing.comment   = comment || "";
      existing.isVerified = !!verifiedBooking;
      if (verifiedBooking) existing.booking = verifiedBooking._id;
      review = await existing.save();
    } else {
      review = await Review.create({
        user:       userId,
        restaurant: restaurantId,
        booking:    verifiedBooking?._id || null,
        rating,
        comment:    comment || "",
        isVerified: !!verifiedBooking,
      });
    }

    // Recalculate restaurant average rating
    const allReviews = await Review.find({ restaurant: restaurantId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Restaurant.findByIdAndUpdate(restaurantId, { rating: Math.round(avg * 10) / 10 });

    const populated = await Review.findById(review._id).populate("user", "name picture");
    return res.status(200).json({ success: true, review: populated });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ message: "You have already reviewed this restaurant" });
    console.error("Review Error:", error);
    return res.status(500).json({ message: "Failed to save review" });
  }
};

// ── GET /api/reviews/:restaurantId  (get all reviews for a restaurant) ───
export const getReviewsByRestaurant = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId })
      .populate("user", "name picture")
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return res.status(200).json({
      success: true,
      reviews,
      averageRating: Math.round(avg * 10) / 10,
      totalReviews:  reviews.length,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// ── GET /api/reviews/my/:restaurantId  (did THIS user review?) ───────────
export const getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      user:       req.user._id,
      restaurant: req.params.restaurantId,
    });
    return res.status(200).json({ success: true, review: review || null });
  } catch {
    return res.status(500).json({ message: "Failed to fetch your review" });
  }
};

// ── DELETE /api/reviews/:restaurantId  (delete own review) ───────────────
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      user:       req.user._id,
      restaurant: req.params.restaurantId,
    });
    if (!review) return res.status(404).json({ message: "Review not found" });

    await review.deleteOne();

    // Recalculate rating
    const remaining = await Review.find({ restaurant: req.params.restaurantId });
    const newRating = remaining.length
      ? Math.round((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length) * 10) / 10
      : 0;
    await Restaurant.findByIdAndUpdate(req.params.restaurantId, { rating: newRating });

    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete review" });
  }
};