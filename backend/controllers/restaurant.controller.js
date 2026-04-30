import Restaurant from "../models/restaurant.model.js";
import FoodItem   from "../models/Fooditem.model.js";
import User       from "../models/User.model.js";
import Review     from "../models/review.model.js";
import cloudinary from "../config/Cloudinary.config.js";
import { invalidateCache } from "../middleware/cache.middleware.js";

// ── Helper: check ownership ───────────────────────────────────
const canManage = (user, restaurant) => {
  if (user.role === "superadmin") return true;
  if (user.role === "owner" && restaurant.addedBy?.toString() === user._id.toString()) return true;
  return false;
};

// ════════════════════════════════════════════
//  RESTAURANT CONTROLLERS
// ════════════════════════════════════════════

export const getAllRestaurants = async (req, res) => {
  try {
    // .lean() returns plain JS objects instead of Mongoose docs — 2-5x faster
    const restaurants = await Restaurant.find()
      .populate("addedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const ids = restaurants.map(r => r._id);

    const [reviewCounts, latestReviews] = await Promise.all([
      Review.aggregate([
        { $match: { restaurant: { $in: ids } } },
        { $group: { _id: "$restaurant", count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { restaurant: { $in: ids } } },
        { $sort:  { createdAt: -1 } },
        {
          $group: {
            _id:       "$restaurant",
            latestRating:  { $first: "$rating" },
            latestComment: { $first: "$comment" },
            latestUserId:  { $first: "$user" },
          },
        },
      ]),
    ]);

    // Populate user names for latest reviews — .lean() for speed
    const userIds = latestReviews.map(r => r.latestUserId).filter(Boolean);
    const users   = await User.find({ _id: { $in: userIds } }, "name").lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u.name]));

    const countMap  = Object.fromEntries(reviewCounts.map(r => [r._id.toString(), r.count]));
    const reviewMap = Object.fromEntries(
      latestReviews.map(r => [r._id.toString(), {
        rating:   r.latestRating,
        comment:  r.latestComment,
        userName: userMap[r.latestUserId?.toString()] || "Guest",
      }])
    );

    const enriched = restaurants.map(r => ({
      ...r,                                          // already plain object from .lean()
      reviewCount:  countMap[r._id.toString()] || 0,
      latestReview: reviewMap[r._id.toString()] || null,
    }));

    res.status(200).json({ success: true, restaurants: enriched });
  } catch (err) {
    console.error("getAllRestaurants error:", err);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate("addedBy", "name email")
      .lean();
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const foodItems = await FoodItem.find({ restaurant: req.params.id })
      .sort({ category: 1, createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, restaurant, foodItems });
  } catch {
    res.status(500).json({ message: "Failed to fetch restaurant" });
  }
};

// Owner apna restaurant dekhe
export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ addedBy: req.user._id }).lean();
    if (!restaurant) return res.status(404).json({ message: "No restaurant found. Contact superadmin." });

    const foodItems = await FoodItem.find({ restaurant: restaurant._id })
      .sort({ category: 1 })
      .lean();
    res.status(200).json({ success: true, restaurant, foodItems });
  } catch {
    res.status(500).json({ message: "Failed to fetch your restaurant" });
  }
};

// Owner's all restaurants
export const getMyRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ addedBy: req.user._id }).lean();
    
    const restaurantIds = restaurants.map(r => r._id);
    const foodItems = await FoodItem.find({ restaurant: { $in: restaurantIds } })
      .sort({ category: 1 })
      .lean();
    
    // Pass user data to include subscription Plan
    const user = await User.findById(req.user._id).lean();

    res.status(200).json({ success: true, restaurants, foodItems, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your restaurants" });
  }
};

// Superadmin or Owner — create restaurant
export const createRestaurant = async (req, res) => {
  try {
    if (req.user.role === "owner") {
      const user = await User.findById(req.user._id);
      const plan = user.ownerApplication?.subscriptionPlan?.toLowerCase() || "silver";
      const limit = (plan.includes("platinum") || plan.includes("diamond")) ? 8 : plan.includes("gold") ? 5 : 1;
      
      const count = await Restaurant.countDocuments({ addedBy: req.user._id });
      if (count >= limit) {
        return res.status(403).json({ message: `Your ${plan.toUpperCase()} plan only allows up to ${limit} restaurant(s).` });
      }
    }
    const { name, description, address, city, phoneNumber, managerContact,
      telNumber, cuisineTypes, openingTime, closingTime, rating,
      priceRange, image, imagePublicId, venueType, events, offers } = req.body;

    if (!name || !address || !city)
      return res.status(400).json({ message: "Name, address and city are required" });

    const restaurant = await Restaurant.create({
      name, description, address, city, phoneNumber, managerContact,
      telNumber, cuisineTypes: cuisineTypes || [],
      openingTime, closingTime,
      rating: rating || 0, priceRange: priceRange || "₹₹",
      image: image || "", imagePublicId: imagePublicId || "",
      venueType: venueType || "dining", events: events || [], offers: offers || [],
      isActive: true, addedBy: req.user._id,
    });

    // Bust cache so listing reflects the new restaurant
    invalidateCache("/api/restaurants");

    res.status(201).json({ success: true, message: "Restaurant added!", restaurant });
  } catch (error) {
    res.status(500).json({ message: "Failed to create restaurant" });
  }
};

// Superadmin OR owner (only their own)
export const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!canManage(req.user, restaurant))
      return res.status(403).json({ message: "Access denied — not your restaurant" });

    const updated = await Restaurant.findByIdAndUpdate(
      req.params.id, { ...req.body }, { new: true, runValidators: true }
    );

    // Bust cache for this restaurant and the listing
    invalidateCache("/api/restaurants");

    res.status(200).json({ success: true, message: "Restaurant updated", restaurant: updated });
  } catch {
    res.status(500).json({ message: "Failed to update restaurant" });
  }
};

// Superadmin only
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    if (restaurant.imagePublicId) await cloudinary.uploader.destroy(restaurant.imagePublicId);
    await FoodItem.deleteMany({ restaurant: req.params.id });
    await restaurant.deleteOne();

    // Bust cache
    invalidateCache("/api/restaurants");

    res.status(200).json({ success: true, message: "Restaurant and food items deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete restaurant" });
  }
};

export const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Not found" });
    if (!canManage(req.user, restaurant))
      return res.status(403).json({ message: "Access denied" });

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    // Bust cache since active status affects listing
    invalidateCache("/api/restaurants");

    res.status(200).json({ success: true, message: `Restaurant ${restaurant.isActive ? "activated" : "deactivated"}`, isActive: restaurant.isActive });
  } catch {
    res.status(500).json({ message: "Failed to toggle status" });
  }
};

// ════════════════════════════════════════════
//  FOOD ITEM CONTROLLERS
// ════════════════════════════════════════════

export const getFoodItemsByRestaurant = async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ restaurant: req.params.restaurantId })
      .sort({ category: 1, createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, foodItems });
  } catch {
    res.status(500).json({ message: "Failed to fetch food items" });
  }
};

export const createFoodItem = async (req, res) => {
  try {
    const { name, description, price, offer, category, isVeg,
      spicyLevel, isAvailable, restaurant, image, imagePublicId } = req.body;

    if (!name || !price || !restaurant)
      return res.status(400).json({ message: "Name, price and restaurant required" });

    const rest = await Restaurant.findById(restaurant);
    if (!rest) return res.status(404).json({ message: "Restaurant not found" });
    if (!canManage(req.user, rest))
      return res.status(403).json({ message: "Access denied — not your restaurant" });

    const foodItem = await FoodItem.create({
      name, description, price: Number(price), offer: Number(offer) || 0,
      category: category || "Other", isVeg: isVeg !== undefined ? isVeg : true,
      spicyLevel: spicyLevel || "Medium",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      restaurant, image: image || "", imagePublicId: imagePublicId || "",
      addedBy: req.user._id,
    });

    // Bust restaurant detail cache (food items changed)
    invalidateCache(`/api/restaurants/${restaurant}`);

    res.status(201).json({ success: true, message: "Food item added!", foodItem });
  } catch (error) {
    res.status(500).json({ message: "Failed to create food item" });
  }
};

export const updateFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate("restaurant");
    if (!foodItem) return res.status(404).json({ message: "Food item not found" });
    if (!canManage(req.user, foodItem.restaurant))
      return res.status(403).json({ message: "Access denied" });

    const updated = await FoodItem.findByIdAndUpdate(
      req.params.id, { ...req.body }, { new: true, runValidators: true }
    );

    invalidateCache(`/api/restaurants/${foodItem.restaurant._id}`);

    res.status(200).json({ success: true, message: "Food item updated", foodItem: updated });
  } catch {
    res.status(500).json({ message: "Failed to update food item" });
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate("restaurant");
    if (!foodItem) return res.status(404).json({ message: "Food item not found" });
    if (!canManage(req.user, foodItem.restaurant))
      return res.status(403).json({ message: "Access denied" });

    if (foodItem.imagePublicId) await cloudinary.uploader.destroy(foodItem.imagePublicId);
    await foodItem.deleteOne();

    invalidateCache(`/api/restaurants/${foodItem.restaurant._id}`);

    res.status(200).json({ success: true, message: "Food item deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete food item" });
  }
};

export const toggleFoodItemAvailability = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate("restaurant");
    if (!foodItem) return res.status(404).json({ message: "Not found" });
    if (!canManage(req.user, foodItem.restaurant))
      return res.status(403).json({ message: "Access denied" });

    foodItem.isAvailable = !foodItem.isAvailable;
    await foodItem.save();

    invalidateCache(`/api/restaurants/${foodItem.restaurant._id}`);

    res.status(200).json({ success: true, message: `Item ${foodItem.isAvailable ? "available" : "unavailable"}`, isAvailable: foodItem.isAvailable });
  } catch {
    res.status(500).json({ message: "Failed to toggle availability" });
  }
};