import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OwnerNightlifeManager from "./OwnerNightlifeManager";

interface Restaurant {
  _id: string;
  name: string;
  address: string;
  city: string;
  cuisineTypes: string[];
  openingTime: string;
  closingTime: string;
  rating: number;
  priceRange: string;
  image: string;
  isActive: boolean;
  venueType?: string;
  events?: any[];
  offers?: any[];
}

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  offer: number;
  category: string;
  isVeg: boolean;
  spicyLevel: string;
  isAvailable: boolean;
  image: string;
}

interface BookingFoodItem {
  foodId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface BookingDeliveryDetails {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  deliverySlot?: string;
}

interface Booking {
  _id: string;
  user: { _id: string; name: string; email: string; picture?: string };
  date: string;
  timeSlot: string;
  guests: number;
  specialRequest: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "rejected"
    | "cancelled";
  orderType?: "table" | "delivery";
  paymentStatus?: "pending" | "paid" | "failed" | "cod";
  totalAmount?: number;
  foodItems?: BookingFoodItem[];
  deliveryDetails?: BookingDeliveryDetails;
  rejectionReason?: string;
  createdAt: string;
}

type Tab = "overview" | "bookings" | "delivery" | "menu" | "nightlife";

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

const CATEGORIES = [
  "Starter",
  "Main Course",
  "Dessert",
  "Beverage",
  "Snacks",
  "Breads",
  "Rice & Biryani",
  "Other",
];

const SPICY_LEVELS = ["No Spicy", "Mild", "Medium", "Hot", "Extra Hot"];

const STATUS_STYLE: Record<
  string,
  { bg: string; border: string; color: string; label: string }
> = {
  pending: {
    bg: "rgba(251,191,36,.12)",
    border: "rgba(251,191,36,.3)",
    color: "#fbbf24",
    label: "Pending",
  },
  confirmed: {
    bg: "rgba(40,200,120,.1)",
    border: "rgba(40,200,120,.25)",
    color: "#60d090",
    label: "Confirmed",
  },
  preparing: {
    bg: "rgba(59,130,246,.12)",
    border: "rgba(59,130,246,.28)",
    color: "#60a5fa",
    label: "Preparing",
  },
  out_for_delivery: {
    bg: "rgba(99,102,241,.12)",
    border: "rgba(99,102,241,.28)",
    color: "#818cf8",
    label: "Out for Delivery",
  },
  delivered: {
    bg: "rgba(16,185,129,.14)",
    border: "rgba(16,185,129,.28)",
    color: "#34d399",
    label: "Delivered",
  },
  rejected: {
    bg: "rgba(240,80,80,.1)",
    border: "rgba(240,80,80,.22)",
    color: "#f07070",
    label: "Rejected",
  },
  cancelled: {
    bg: "rgba(160,160,160,.08)",
    border: "rgba(160,160,160,.2)",
    color: "#94a3b8",
    label: "Cancelled",
  },
};

const PAYMENT_STYLE: Record<
  string,
  { bg: string; border: string; color: string; label: string }
> = {
  pending: {
    bg: "rgba(251,191,36,.12)",
    border: "rgba(251,191,36,.3)",
    color: "#fbbf24",
    label: "Payment Pending",
  },
  paid: {
    bg: "rgba(40,200,120,.12)",
    border: "rgba(40,200,120,.25)",
    color: "#60d090",
    label: "Paid Online",
  },
  failed: {
    bg: "rgba(240,80,80,.1)",
    border: "rgba(240,80,80,.22)",
    color: "#f07070",
    label: "Payment Failed",
  },
  cod: {
    bg: "rgba(160,96,240,.14)",
    border: "rgba(160,96,240,.24)",
    color: "#c090ff",
    label: "Cash on Delivery",
  },
};

const getBookingKindLabel = (booking: Booking) =>
  booking.orderType === "delivery" ? "Delivery Order" : "Table Booking";

const getNextOwnerStatus = (booking: Booking): "preparing" | "out_for_delivery" | "delivered" | null => {
  if (booking.orderType !== "delivery") return null;
  if (booking.status === "confirmed") return "preparing";
  if (booking.status === "preparing") return "out_for_delivery";
  if (booking.status === "out_for_delivery") return "delivered";
  return null;
};

const getOwnerActionLabel = (status: Booking["status"]) => {
  if (status === "confirmed") return "Start Preparing";
  if (status === "preparing") return "Out for Delivery";
  if (status === "out_for_delivery") return "Mark Delivered";
  return "Update";
};

const uploadToCloudinary = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);
  fd.append("folder", "tabletime");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    {
      method: "POST",
      body: fd,
    }
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return { url: data.secure_url, publicId: data.public_id };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatShortDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

const formatLongDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function MiniLineChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const width = 1000;
  const padding = 28;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const points = data
    .map((d, i) => {
      const x =
        padding + (i * usableWidth) / Math.max(data.length - 1, 1);
      const y = padding + usableHeight - (d.value / maxValue) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="od-chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="od-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="odLineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(160,96,240,0.55)" />
            <stop offset="100%" stopColor="rgba(160,96,240,0.02)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((g) => {
          const y = padding + (g * usableHeight) / 4;
          return (
            <line
              key={g}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,.06)"
              strokeWidth="1"
            />
          );
        })}

        {data.length > 1 && (
          <>
            <polyline
              fill="none"
              stroke="#a060f0"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            <polygon
              fill="url(#odLineFill)"
              points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`}
            />
          </>
        )}

        {data.map((d, i) => {
          const x =
            padding + (i * usableWidth) / Math.max(data.length - 1, 1);
          const y = padding + usableHeight - (d.value / maxValue) * usableHeight;
          return (
            <g key={d.label + i}>
              <circle cx={x} cy={y} r="5.5" fill="#a060f0" />
              <circle cx={x} cy={y} r="10" fill="rgba(160,96,240,.16)" />
            </g>
          );
        })}
      </svg>

      <div className="od-chart-label-row">
        {data.map((d) => (
          <div key={d.label} className="od-chart-xlabel">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({
  data,
  color = "linear-gradient(180deg,#a060f0,#7030d0)",
  height = 220,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="od-bar-wrap" style={{ height }}>
      <div className="od-bar-grid" />
      <div className="od-bar-columns">
        {data.map((d) => (
          <div key={d.label} className="od-bar-col">
            <div className="od-bar-top-value">{d.value}</div>
            <div
              className="od-bar"
              style={{
                height: `${Math.max((d.value / maxValue) * 100, d.value > 0 ? 8 : 0)}%`,
                background: color,
              }}
            />
            <div className="od-bar-label">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="od-progress-card">
      <div className="od-progress-top">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="od-progress-track">
        <div
          className="od-progress-fill"
          style={{
            width: `${value}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark } = useTheme();

  const token = localStorage.getItem("token");
  const ownerName = localStorage.getItem("name") || "Owner";
  const ownerPic = localStorage.getItem("picture") || "";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const [tab, setTab] = useState<Tab>("overview");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  
  // Multi-restaurant support
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeResId, setActiveResId] = useState<string>("all");

  const [userPlan, setUserPlan] = useState<string>("silver");
  const [showAddResModal, setShowAddResModal] = useState(false);

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [allRestaurantFoodItems, setAllRestaurantFoodItems] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookFilter, setBookFilter] = useState<
    "all" | "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "rejected" | "cancelled"
  >("all");

  const [loading, setLoading] = useState(true);
  const [bookLoading, setBookLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [imgUploading, setImgUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [newPendingCount, setNewPendingCount] = useState(0);

  const [foodForm, setFoodForm] = useState({
    name: "",
    description: "",
    price: "",
    offer: "0",
    category: "Other",
    isVeg: true,
    spicyLevel: "Medium",
    isAvailable: true,
    image: "",
    imagePublicId: "",
  });
  const [foodImgPreview, setFoodImgPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit food item state
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    offer: "0",
    category: "Other",
    isVeg: true,
    spicyLevel: "Medium",
    isAvailable: true,
    image: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "owner") {
      navigate("/unauthorized", { replace: true });
    }
  }, [token, navigate]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMyRestaurants = useCallback(async () => {
    try {
      const res = await api.get("/restaurants/my/restaurants");
      if (res.data?.success) {
        const fetchedRestaurants: Restaurant[] = res.data.restaurants || [];
        setRestaurants(fetchedRestaurants);
        if (fetchedRestaurants.length > 0) {
          setRestaurant(fetchedRestaurants[0]);
          setActiveResId(fetchedRestaurants[0]._id); // Set first restaurant as active by default
        } else {
          setActiveResId("none"); // No restaurants at all
        }
        const allFoods = res.data.foodItems || [];
        setAllRestaurantFoodItems(allFoods); // Keep a master copy for filtering
        if (fetchedRestaurants.length > 0) {
          // Show only food items for the first (active) restaurant
          const firstId = fetchedRestaurants[0]._id;
          setFoodItems(allFoods.filter((f: any) =>
            f.restaurant === firstId || f.restaurant?._id === firstId
          ));
        } else {
          setFoodItems(allFoods);
        }
        const plan = res.data.user?.ownerApplication?.subscriptionPlan;
        if (plan) {
          setUserPlan(plan.toLowerCase());
        }
      }
    } catch {
      showToast("Failed to load restaurants", "error");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookLoading(true);
    try {
      const res = await api.get(`/bookings/owner?restaurantId=${activeResId}`);
      const data = res.data;

      if (data?.success) {
        const list = data.bookings || [];
        setBookings(list);
        setPendingCount(list.filter((b: Booking) => b.status === "pending").length);
      }
    } catch {
      showToast("Failed to load bookings", "error");
    } finally {
      setBookLoading(false);
    }
  }, [activeResId]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await api.get("/bookings/owner/count");
      if (res.data?.success) {
        setNewPendingCount(res.data.count || 0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMyRestaurants(), fetchBookings(), fetchPendingCount()]);
      setLoading(false);
    };
    init();
  }, [fetchMyRestaurants, fetchBookings, fetchPendingCount]);

  useEffect(() => {
    if (tab === "bookings" || tab === "delivery") {
      fetchBookings();
      fetchPendingCount();
    }
  }, [tab, activeResId, fetchBookings, fetchPendingCount]);

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    try {
      const { url, publicId } = await uploadToCloudinary(file);
      setFoodForm((p) => ({ ...p, image: url, imagePublicId: publicId }));
      setFoodImgPreview(url);
      showToast("Image uploaded!", "success");
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurant) {
      showToast("No restaurant found", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/restaurants/food", {
        ...foodForm,
        restaurant: restaurant._id,
        price: Number(foodForm.price),
        offer: Number(foodForm.offer) || 0,
      });

      if (res.status >= 200 && res.status < 300) {
        showToast("Food item added!", "success");
        setFoodForm({
          name: "",
          description: "",
          price: "",
          offer: "0",
          category: "Other",
          isVeg: true,
          spicyLevel: "Medium",
          isAvailable: true,
          image: "",
          imagePublicId: "",
        });
        setFoodImgPreview("");
        fetchMyRestaurants();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to add food item", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFood = async (id: string) => {
    try {
      const res = await api.patch(`/restaurants/food/${id}/toggle`);
      showToast(res.data?.message || "Item updated", "success");
      fetchMyRestaurants();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update item", "error");
    }
  };

  const handleEditFood = (food: FoodItem) => {
    setEditingFood(food);
    setEditForm({
      name: food.name,
      description: food.description || "",
      price: String(food.price),
      offer: String(food.offer || 0),
      category: food.category || "Other",
      isVeg: food.isVeg,
      spicyLevel: food.spicyLevel || "Medium",
      isAvailable: food.isAvailable,
      image: food.image || "",
    });
  };

  const handleUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;

    setEditSubmitting(true);
    try {
      const res = await api.put(`/restaurants/food/${editingFood._id}`, {
        ...editForm,
        price: Number(editForm.price),
        offer: Number(editForm.offer) || 0,
      });

      if (res.status >= 200 && res.status < 300) {
        showToast("Food item updated!", "success");
        setEditingFood(null);
        fetchMyRestaurants();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update food item", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    status:
      | "confirmed"
      | "preparing"
      | "out_for_delivery"
      | "delivered"
      | "rejected",
    reason?: string
  ) => {
    setActionLoading(bookingId + status);
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, {
        status,
        rejectionReason: reason || "",
      });

      const successMessage =
        status === "confirmed"
          ? "Request confirmed! ✅"
          : status === "preparing"
          ? "Order marked as preparing 👨‍🍳"
          : status === "out_for_delivery"
          ? "Order is out for delivery 🚚"
          : status === "delivered"
          ? "Order marked delivered 📦"
          : "Booking rejected ✗";

      showToast(successMessage, "success");

      setRejectModal(null);
      setRejectReason("");

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                status,
              }
            : b
        )
      );

      const updatedBooking = res.data?.booking;

      setBookings((prev) => {
        const next = prev.map((b) =>
          b._id === bookingId ? { ...b, ...(updatedBooking || {}), status } : b
        );
        setPendingCount(next.filter((b) => b.status === "pending").length);
        return next;
      });

      if (updatedBooking) {
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, ...res.data.booking } : b))
        );
      }
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to update booking",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const tableBookings = useMemo(
    () => bookings.filter((b) => b.orderType !== "delivery"),
    [bookings]
  );

  const deliveryBookings = useMemo(
    () => bookings.filter((b) => b.orderType === "delivery"),
    [bookings]
  );

  const filteredBookings = useMemo(
    () => {
      const source = tab === "delivery" ? deliveryBookings : tableBookings;
      return source.filter((b) => (bookFilter === "all" ? true : b.status === bookFilter));
    },
    [tableBookings, deliveryBookings, bookFilter, tab]
  );

  const analytics = useMemo(() => {
    const today = new Date();

    const totalReservations = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending");
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const rejected = bookings.filter((b) => b.status === "rejected");
    const cancelled = bookings.filter((b) => b.status === "cancelled");

    const totalGuests = bookings.reduce((sum, b) => sum + (b.guests || 0), 0);
    const confirmedGuests = confirmed.reduce((sum, b) => sum + (b.guests || 0), 0);

    const avgGuestsPerReservation =
      totalReservations > 0 ? +(totalGuests / totalReservations).toFixed(1) : 0;

    const revenueStatuses = ["confirmed", "preparing", "out_for_delivery", "delivered"];
    const totalRevenue = bookings
      .filter((b) => revenueStatuses.includes(b.status))
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const todayBookings = bookings.filter((b) => isSameDay(new Date(b.date), today));
    const todayReservations = todayBookings.length;
    const todayGuests = todayBookings.reduce((sum, b) => sum + (b.guests || 0), 0);

    const todayConfirmed = todayBookings.filter((b) => revenueStatuses.includes(b.status));
    const todayRevenue = todayConfirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const seatingCapacity = 60;
    const expectedDailyCapacityGuests = seatingCapacity;
    const occupancy = clamp(
      Math.round((todayGuests / expectedDailyCapacityGuests) * 100),
      0,
      100
    );

    const suggestedStaffOnShift =
      todayReservations <= 4
        ? 3
        : todayReservations <= 8
        ? 5
        : todayReservations <= 12
        ? 7
        : 9;

    const avgSpendPerGuest = confirmedGuests > 0 ? +(totalRevenue / confirmedGuests).toFixed(0) : 0;

    const bookingsByDateMap: Record<
      string,
      { reservations: number; guests: number; revenue: number }
    > = {};

    bookings.forEach((b) => {
      const key = new Date(b.date).toISOString().split("T")[0];
      if (!bookingsByDateMap[key]) {
        bookingsByDateMap[key] = { reservations: 0, guests: 0, revenue: 0 };
      }

      bookingsByDateMap[key].reservations += 1;
      bookingsByDateMap[key].guests += b.guests || 0;
      if (revenueStatuses.includes(b.status)) {
        bookingsByDateMap[key].revenue += (b.totalAmount || 0);
      }
    });

    const last7Days: { label: string; reservations: number; guests: number; revenue: number }[] =
      [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);

      const key = d.toISOString().split("T")[0];
      const entry = bookingsByDateMap[key] || {
        reservations: 0,
        guests: 0,
        revenue: 0,
      };

      last7Days.push({
        label: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        reservations: entry.reservations,
        guests: entry.guests,
        revenue: entry.revenue,
      });
    }

    return {
      totalReservations,
      pending: pending.length,
      confirmed: confirmed.length,
      rejected: rejected.length,
      cancelled: cancelled.length,
      totalGuests,
      confirmedGuests,
      totalRevenue,
      todayReservations,
      todayGuests,
      todayRevenue,
      avgGuestsPerReservation,
      occupancy,
      suggestedStaffOnShift,
      seatingCapacity,
      avgSpendPerGuest,
      last7Days,
    };
  }, [bookings]);

  const bookCounts = useMemo(
    () => {
      const source = tab === "delivery" ? deliveryBookings : tableBookings;
      return {
        all: source.length,
        pending: source.filter((b) => b.status === "pending").length,
        confirmed: source.filter((b) => b.status === "confirmed").length,
        preparing: source.filter((b) => b.status === "preparing").length,
        out_for_delivery: source.filter((b) => b.status === "out_for_delivery").length,
        delivered: source.filter((b) => b.status === "delivered").length,
        rejected: source.filter((b) => b.status === "rejected").length,
        cancelled: source.filter((b) => b.status === "cancelled").length,
      };
    },
    [tableBookings, deliveryBookings, tab]
  );

  const tablePendingCount = useMemo(
    () => tableBookings.filter((b) => b.status === "pending").length,
    [tableBookings]
  );

  const deliveryPendingCount = useMemo(
    () => deliveryBookings.filter((b) => b.status === "pending").length,
    [deliveryBookings]
  );

  const portfolioComparison = useMemo(() => {
    if (activeResId !== "all" || restaurants.length < 2) return [];
    
    return restaurants.map((r) => {
      const bks = bookings.filter((b: any) => 
        b.restaurant === r._id || b.restaurant?._id === r._id
      );
      
      const rev = bks.filter(b => ["confirmed", "preparing", "out_for_delivery", "delivered"].includes(b.status))
                     .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const gst = bks.reduce((sum, b) => sum + (b.guests || 0), 0);
      const resCount = bks.length;

      return {
        label: r.name.substring(0, 10),
        revenue: rev,
        guests: gst,
        reservations: resCount
      };
    });
  }, [restaurants, bookings, activeResId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0418",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Montserrat,sans-serif",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "2px solid rgba(160,96,240,.15)",
            borderTopColor: "#a060f0",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: "rgba(180,140,255,.4)",
            letterSpacing: "0.2em",
          }}
        >
          LOADING
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Cinzel:wght@400;500;600&display=swap');

        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes od-fadeUp{
          from{opacity:0;transform:translateY(12px)}
          to{opacity:1;transform:translateY(0)}
        }

        @keyframes od-spin{to{transform:rotate(360deg)}}

        @keyframes od-toast{
          from{opacity:0;transform:translateY(12px)}
          to{opacity:1;transform:translateY(0)}
        }

        @keyframes od-pulse{
          0%,100%{opacity:1}
          50%{opacity:.4}
        }

        .od-root{
          min-height:100vh;
          background:#0a0418;
          color:#f0ebff;
          font-family:'Montserrat',sans-serif;
          display:flex;
        }

        .od-sb{
          width:220px;
          min-width:220px;
          background:rgba(255,255,255,.025);
          border-right:1px solid rgba(160,96,240,.12);
          display:flex;
          flex-direction:column;
        }

        .od-sb-logo{
          display:flex;
          align-items:center;
          gap:10px;
          padding:20px 16px 16px;
          border-bottom:1px solid rgba(160,96,240,.1);
          text-decoration:none;
        }

        .od-logo-ic{
          width:34px;
          height:34px;
          border-radius:9px;
          flex-shrink:0;
          background:linear-gradient(135deg,#059669,#10b981);
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 0 14px rgba(16,185,129,.3);
        }

        .od-logo-tx{
          font-family:'Cinzel',serif;
          font-size:14px;
          font-weight:500;
          letter-spacing:.06em;
          color:#d4b0ff;
        }

        .od-logo-bd{
          font-size:8px;
          font-weight:600;
          letter-spacing:.1em;
          background:rgba(16,185,129,.15);
          color:#34d399;
          border:1px solid rgba(16,185,129,.25);
          padding:2px 7px;
          border-radius:20px;
        }

        .od-nav{
          flex:1;
          padding:12px 8px;
          display:flex;
          flex-direction:column;
          gap:3px;
        }

        .od-ni{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 12px;
          border-radius:8px;
          border:none;
          background:none;
          cursor:pointer;
          font-family:'Montserrat',sans-serif;
          font-size:12px;
          font-weight:500;
          color:rgba(200,165,255,.38);
          transition:all .2s;
          width:100%;
          text-align:left;
          position:relative;
        }

        .od-ni:hover{
          color:rgba(215,185,255,.78);
          background:rgba(160,96,240,.08);
        }

        .od-ni.active{
          color:#e0c4ff;
          background:rgba(160,96,240,.16);
        }

        .od-ni-ic{
          flex-shrink:0;
          opacity:.4;
          transition:opacity .2s;
        }

        .od-ni:hover .od-ni-ic,.od-ni.active .od-ni-ic{
          opacity:1;
        }

        .od-ni-badge{
          margin-left:auto;
          min-width:18px;
          height:18px;
          border-radius:9px;
          background:rgba(251,191,36,.25);
          color:#fbbf24;
          border:1px solid rgba(251,191,36,.3);
          font-size:9px;
          font-weight:700;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0 5px;
        }

        .od-sb-ft{
          padding:12px 8px;
          border-top:1px solid rgba(160,96,240,.1);
        }

        .od-logout{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 12px;
          border-radius:8px;
          border:none;
          background:none;
          cursor:pointer;
          width:100%;
          font-family:'Montserrat',sans-serif;
          font-size:12px;
          font-weight:500;
          color:rgba(255,140,140,.5);
          transition:all .2s;
        }

        .od-logout:hover{
          color:rgba(255,160,160,.88);
          background:rgba(255,80,80,.08);
        }

        .od-main{
          flex:1;
          display:flex;
          flex-direction:column;
          min-width:0;
        }

        .od-tb{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 28px;
          height:62px;
          background:rgba(255,255,255,.02);
          border-bottom:1px solid rgba(160,96,240,.1);
          position:sticky;
          top:0;
          z-index:50;
          backdrop-filter:blur(20px);
        }

        .od-pt{
          font-family:'Cinzel',serif;
          font-size:14px;
          font-weight:500;
          color:rgba(220,200,255,.78);
          letter-spacing:.06em;
        }

        .od-chip{
          display:flex;
          align-items:center;
          gap:8px;
          padding:4px 14px 4px 4px;
          border-radius:20px;
          background:rgba(16,185,129,.1);
          border:1px solid rgba(16,185,129,.2);
        }

        .od-chip-lb{
          font-size:11px;
          font-weight:500;
          color:rgba(52,211,153,.85);
          letter-spacing:.06em;
        }

        .od-content{
          flex:1;
          padding:26px 28px;
          overflow-y:auto;
        }

        .od-card{
          background:rgba(255,255,255,.025);
          border:1px solid rgba(160,96,240,.1);
          border-radius:16px;
          overflow:hidden;
          margin-bottom:18px;
          animation:od-fadeUp .5s ease both;
        }

        .od-card-hd{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:14px 20px;
          border-bottom:1px solid rgba(160,96,240,.08);
          flex-wrap:wrap;
          gap:8px;
        }

        .od-card-title{
          font-family:'Cinzel',serif;
          font-size:13px;
          font-weight:500;
          color:rgba(220,200,255,.7);
          letter-spacing:.08em;
        }

        .od-rest-card{
          background:rgba(255,255,255,.03);
          border:1px solid rgba(160,96,240,.12);
          border-radius:16px;
          overflow:hidden;
          margin-bottom:20px;
          animation:od-fadeUp .5s ease both;
        }

        .od-rest-banner{
          width:100%;
          height:200px;
          object-fit:cover;
          display:block;
        }

        .od-rest-banner-placeholder{
          width:100%;
          height:200px;
          background:linear-gradient(135deg,rgba(112,48,208,.2),rgba(60,20,140,.3));
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:48px;
        }

        .od-rest-info{
          padding:18px 22px;
        }

        .od-rest-name{
          font-family:'Cinzel',serif;
          font-size:22px;
          font-weight:500;
          color:rgba(220,200,255,.88);
          letter-spacing:.04em;
          margin-bottom:6px;
        }

        .od-rest-meta{
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
          font-size:12px;
          color:rgba(180,140,255,.5);
        }

        .od-rest-tag{
          padding:3px 10px;
          border-radius:20px;
          font-size:10px;
          font-weight:600;
          background:rgba(160,96,240,.15);
          color:#c090ff;
          border:1px solid rgba(160,96,240,.2);
        }

        .od-rest-active{
          background:rgba(40,200,120,.1);
          color:#60d090;
          border-color:rgba(40,200,120,.2);
        }

        .od-stat-grid{
          display:grid;
          grid-template-columns:repeat(4, minmax(0,1fr));
          gap:12px;
          margin-top:16px;
        }

        .od-stat{
          background:rgba(255,255,255,.03);
          border:1px solid rgba(160,96,240,.08);
          border-radius:12px;
          padding:14px 14px;
          text-align:center;
          min-height:86px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:6px;
        }

        .od-stat-num{
          font-family:'Cinzel',serif;
          font-size:22px;
          color:#a060f0;
          line-height:1.1;
          word-break:break-word;
        }

        .od-stat-lb{
          font-size:9px;
          color:rgba(200,170,255,.3);
          letter-spacing:.18em;
          text-transform:uppercase;
        }

        .od-analytics-grid{
          display:grid;
          grid-template-columns:repeat(4, minmax(0,1fr));
          gap:14px;
          padding:18px;
        }

        .od-metric-card{
          background:rgba(255,255,255,.03);
          border:1px solid rgba(160,96,240,.1);
          border-radius:14px;
          padding:16px;
          display:flex;
          flex-direction:column;
          gap:8px;
          min-height:112px;
        }

        .od-metric-kicker{
          font-size:10px;
          letter-spacing:.15em;
          text-transform:uppercase;
          color:rgba(200,165,255,.34);
          font-weight:600;
        }

        .od-metric-value{
          font-family:'Cinzel',serif;
          font-size:26px;
          color:#efe8ff;
          line-height:1.05;
        }

        .od-metric-sub{
          font-size:11px;
          color:rgba(200,170,255,.45);
          line-height:1.5;
        }

        .od-two-grid{
          display:grid;
          grid-template-columns:1.4fr 1fr;
          gap:18px;
          margin-bottom:18px;
        }

        .od-three-grid{
          display:grid;
          grid-template-columns:1fr 1fr 1fr;
          gap:18px;
          margin-bottom:18px;
        }

        .od-chart-shell{
          padding:18px 18px 8px;
        }

        .od-chart-svg{
          width:100%;
          height:220px;
          display:block;
        }

        .od-chart-label-row{
          display:grid;
          grid-template-columns:repeat(7,minmax(0,1fr));
          gap:6px;
          padding:6px 8px 0;
        }

        .od-chart-xlabel{
          text-align:center;
          font-size:10px;
          color:rgba(200,170,255,.38);
        }

        .od-bar-wrap{
          position:relative;
          padding:20px 16px 14px;
        }

        .od-bar-grid{
          position:absolute;
          inset:20px 16px 32px 16px;
          background:
            linear-gradient(to top, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size:100% 25%;
          pointer-events:none;
        }

        .od-bar-columns{
          position:relative;
          z-index:1;
          height:100%;
          display:grid;
          grid-template-columns:repeat(7,minmax(0,1fr));
          gap:10px;
          align-items:end;
        }

        .od-bar-col{
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-end;
          height:100%;
          min-width:0;
        }

        .od-bar-top-value{
          font-size:10px;
          color:rgba(220,200,255,.5);
          margin-bottom:6px;
        }

        .od-bar{
          width:100%;
          max-width:42px;
          border-radius:10px 10px 4px 4px;
          box-shadow:0 0 20px rgba(160,96,240,.2);
          min-height:0;
        }

        .od-bar-label{
          margin-top:8px;
          font-size:10px;
          color:rgba(200,170,255,.38);
          text-align:center;
        }

        .od-progress-wrap{
          padding:18px;
          display:flex;
          flex-direction:column;
          gap:14px;
        }

        .od-progress-card{
          background:rgba(255,255,255,.03);
          border:1px solid rgba(160,96,240,.08);
          border-radius:12px;
          padding:14px;
        }

        .od-progress-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          font-size:12px;
          color:rgba(220,200,255,.72);
          margin-bottom:8px;
        }

        .od-progress-track{
          width:100%;
          height:8px;
          background:rgba(255,255,255,.06);
          border-radius:999px;
          overflow:hidden;
        }

        .od-progress-fill{
          height:100%;
          border-radius:999px;
        }

        .od-info-stack{
          padding:18px;
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .od-insight{
          background:rgba(255,255,255,.03);
          border:1px solid rgba(160,96,240,.08);
          border-radius:12px;
          padding:14px;
        }

        .od-insight-top{
          font-size:10px;
          letter-spacing:.15em;
          text-transform:uppercase;
          color:rgba(200,165,255,.34);
          margin-bottom:7px;
          font-weight:600;
        }

        .od-insight-value{
          font-family:'Cinzel',serif;
          font-size:24px;
          color:#efe8ff;
          margin-bottom:6px;
        }

        .od-insight-sub{
          font-size:11px;
          color:rgba(200,170,255,.46);
          line-height:1.5;
        }

        .od-form{
          padding:20px 22px;
          display:flex;
          flex-direction:column;
          gap:14px;
        }

        .od-grid2{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }

        .od-grid4{
          display:grid;
          grid-template-columns:1fr 1fr 1fr 1fr;
          gap:12px;
        }

        .od-field{
          display:flex;
          flex-direction:column;
          gap:5px;
        }

        .od-label{
          font-size:10px;
          font-weight:600;
          color:rgba(200,165,255,.38);
          letter-spacing:.12em;
          text-transform:uppercase;
        }

        .od-input,.od-textarea,.od-select,.od-modal-input{
          background:rgba(255,255,255,.04);
          border:1px solid rgba(160,96,240,.18);
          border-radius:9px;
          padding:10px 12px;
          font-family:'Montserrat',sans-serif;
          font-size:13px;
          color:rgba(225,210,255,.88);
          outline:none;
          width:100%;
        }

        .od-select{
          background:#0a0418;
          cursor:pointer;
          color:rgba(225,210,255,.88);
        }

        .od-select option{
          background:#0d0622;
          color:rgba(225,210,255,.88);
          padding:8px;
        }

        .od-textarea,.od-modal-input{
          resize:vertical;
          min-height:70px;
        }

        .od-input:focus,.od-textarea:focus,.od-select:focus,.od-modal-input:focus{
          border-color:rgba(160,96,240,.5);
          box-shadow:0 0 0 3px rgba(160,96,240,.09);
          background:rgba(160,96,240,.05);
        }

        .od-input::placeholder,.od-textarea::placeholder,.od-modal-input::placeholder{
          color:rgba(180,140,255,.22);
        }

        .od-img-wrap{
          position:relative;
          border:1.5px dashed rgba(160,96,240,.25);
          border-radius:10px;
          overflow:hidden;
          cursor:pointer;
          min-height:100px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(160,96,240,.04);
        }

        .od-img-wrap:hover{
          border-color:rgba(160,96,240,.5);
        }

        .od-img-wrap input[type=file]{
          position:absolute;
          inset:0;
          opacity:0;
          cursor:pointer;
          width:100%;
          height:100%;
        }

        .od-img-preview{
          width:100%;
          height:100px;
          object-fit:cover;
          display:block;
          border-radius:9px;
        }

        .od-img-ph{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:6px;
          padding:20px;
          font-size:10px;
          color:rgba(180,140,255,.4);
        }

        .od-veg-row{
          display:flex;
          gap:8px;
        }

        .od-veg-pill{
          padding:7px 16px;
          border-radius:20px;
          font-size:12px;
          font-weight:500;
          cursor:pointer;
          border:none;
          font-family:'Montserrat',sans-serif;
          transition:all .2s;
          flex:1;
          text-align:center;
        }

        .od-veg-pill.veg.sel{
          background:rgba(40,200,100,.18);
          color:#50e090;
          border:1px solid rgba(40,200,100,.35);
        }

        .od-veg-pill.veg:not(.sel){
          background:rgba(255,255,255,.04);
          color:rgba(200,165,255,.4);
          border:1px solid rgba(160,96,240,.15);
        }

        .od-veg-pill.nonveg.sel{
          background:rgba(240,80,80,.15);
          color:#f07070;
          border:1px solid rgba(240,80,80,.3);
        }

        .od-veg-pill.nonveg:not(.sel){
          background:rgba(255,255,255,.04);
          color:rgba(200,165,255,.4);
          border:1px solid rgba(160,96,240,.15);
        }

        .od-toggle-wrap{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .od-toggle{
          width:38px;
          height:20px;
          border-radius:10px;
          border:none;
          cursor:pointer;
          position:relative;
          transition:all .25s;
          flex-shrink:0;
          padding:0;
        }

        .od-toggle.on{
          background:linear-gradient(135deg,#7030d0,#a060f0);
        }

        .od-toggle.off{
          background:rgba(255,255,255,.08);
          border:1px solid rgba(160,96,240,.15);
        }

        .od-toggle-knob{
          position:absolute;
          top:3px;
          width:12px;
          height:12px;
          border-radius:50%;
          background:#fff;
          transition:all .25s cubic-bezier(.34,1.56,.64,1);
        }

        .od-toggle.on .od-toggle-knob{left:22px}
        .od-toggle.off .od-toggle-knob{left:3px}

        .od-toggle-lb{
          font-size:12px;
          color:rgba(200,165,255,.6);
        }

        .od-submit{
          border:none;
          cursor:pointer;
          font-family:'Montserrat',sans-serif;
          font-size:11px;
          font-weight:600;
          letter-spacing:.1em;
          text-transform:uppercase;
          padding:12px 26px;
          border-radius:8px;
          background:linear-gradient(135deg,#059669,#10b981);
          color:#fff;
          transition:all .25s;
          box-shadow:0 0 22px rgba(16,185,129,.3);
        }

        .od-submit:hover:not(:disabled){
          transform:translateY(-1px);
          box-shadow:0 0 36px rgba(16,185,129,.45);
        }

        .od-submit:disabled{
          opacity:.5;
          cursor:not-allowed;
          transform:none;
        }

        .od-spinner{
          display:inline-block;
          width:12px;
          height:12px;
          border-radius:50%;
          border:2px solid rgba(255,255,255,.2);
          border-top-color:#fff;
          animation:od-spin .7s linear infinite;
        }

        .od-table{
          width:100%;
          border-collapse:collapse;
        }

        .od-table th{
          font-size:9px;
          font-weight:600;
          letter-spacing:.16em;
          text-transform:uppercase;
          color:rgba(200,165,255,.28);
          padding:10px 18px;
          border-bottom:1px solid rgba(160,96,240,.08);
          text-align:left;
        }

        .od-table td{
          padding:12px 18px;
          font-size:12px;
          border-bottom:1px solid rgba(160,96,240,.05);
          color:rgba(215,195,255,.65);
        }

        .od-table tr:last-child td{
          border-bottom:none;
        }

        .od-table tr:hover td{
          background:rgba(160,96,240,.04);
        }

        .od-item-img{
          width:38px;
          height:38px;
          border-radius:7px;
          object-fit:cover;
          flex-shrink:0;
        }

        .od-item-img-ph{
          width:38px;
          height:38px;
          border-radius:7px;
          background:rgba(160,96,240,.12);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:16px;
          flex-shrink:0;
        }

        .od-uc{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .od-un{
          font-weight:500;
          color:rgba(228,210,255,.85);
          font-size:13px;
        }

        .od-ue{
          font-size:10px;
          color:rgba(180,150,255,.38);
          margin-top:1px;
        }

        .od-btn{
          border:none;
          cursor:pointer;
          font-family:'Montserrat',sans-serif;
          font-size:10px;
          font-weight:600;
          letter-spacing:.08em;
          text-transform:uppercase;
          padding:6px 14px;
          border-radius:6px;
          transition:all .18s;
          display:inline-flex;
          align-items:center;
          gap:5px;
        }

        .od-btn-confirm{
          background:rgba(40,200,120,.14);
          color:#60d090;
          border:1px solid rgba(40,200,120,.25);
        }

        .od-btn-confirm:hover:not(:disabled){
          background:rgba(40,200,120,.25);
        }

        .od-btn-reject{
          background:rgba(240,80,80,.12);
          color:#f07070;
          border:1px solid rgba(240,80,80,.22);
        }

        .od-btn-reject:hover:not(:disabled){
          background:rgba(240,80,80,.22);
        }

        .od-btn:disabled{
          opacity:.5;
          cursor:not-allowed;
        }

        .od-status-on{
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:3px 9px;
          border-radius:20px;
          font-size:10px;
          font-weight:600;
          background:rgba(40,200,120,.1);
          color:#60d090;
          border:1px solid rgba(40,200,120,.2);
          cursor:pointer;
        }

        .od-status-off{
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:3px 9px;
          border-radius:20px;
          font-size:10px;
          font-weight:600;
          background:rgba(240,80,80,.1);
          color:#f07070;
          border:1px solid rgba(240,80,80,.2);
          cursor:pointer;
        }

        .od-filter-bar{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }

        .od-filter-pill{
          padding:6px 14px;
          border-radius:20px;
          cursor:pointer;
          font-size:11px;
          font-weight:600;
          border:1px solid rgba(255,255,255,.08);
          background:rgba(255,255,255,.03);
          color:rgba(200,165,255,.4);
          transition:all .2s;
          font-family:'Montserrat',sans-serif;
        }

        .od-filter-pill:hover{
          border-color:rgba(160,96,240,.3);
          color:rgba(200,165,255,.8);
        }

        .od-filter-pill.active{
          background:rgba(160,96,240,.15);
          border-color:rgba(160,96,240,.35);
          color:#c090ff;
        }

        .od-bk-card{
          background:rgba(255,255,255,.025);
          border:1px solid rgba(160,96,240,.1);
          border-radius:14px;
          padding:16px 18px;
          margin-bottom:12px;
          transition:border-color .2s;
          animation:od-fadeUp .4s ease both;
        }

        .od-bk-card:hover{
          border-color:rgba(160,96,240,.22);
        }

        .od-bk-top{
          display:flex;
          align-items:flex-start;
          gap:12px;
          margin-bottom:12px;
        }

        .od-user-av{
          width:40px;
          height:40px;
          border-radius:50%;
          background:linear-gradient(135deg,#7030d0,#a060f0);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:15px;
          font-weight:700;
          color:#fff;
          flex-shrink:0;
          overflow:hidden;
        }

        .od-bk-details{
          display:flex;
          flex-wrap:wrap;
          gap:14px;
          margin-bottom:12px;
          padding:10px 14px;
          background:rgba(255,255,255,.02);
          border-radius:10px;
          border:1px solid rgba(160,96,240,.07);
        }

        .od-bk-detail{
          display:flex;
          align-items:center;
          gap:5px;
          font-size:11px;
          color:rgba(200,170,255,.55);
        }

        .od-bk-detail svg{
          color:rgba(160,96,240,.5);
        }

        .od-bk-actions{
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
        }

        .od-bk-special{
          font-size:11px;
          color:rgba(200,170,255,.4);
          background:rgba(160,96,240,.05);
          border:1px solid rgba(160,96,240,.08);
          border-radius:8px;
          padding:7px 10px;
          margin-bottom:10px;
          display:flex;
          gap:6px;
          align-items:flex-start;
        }

        .od-modal-overlay{
          position:fixed;
          inset:0;
          z-index:999;
          background:rgba(4,2,12,.85);
          backdrop-filter:blur(12px);
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
        }

        .od-modal{
          background:#0d0622;
          border:1px solid rgba(240,80,80,.25);
          border-radius:20px;
          padding:28px;
          max-width:400px;
          width:100%;
        }

        .od-modal-title{
          font-family:'Cinzel',serif;
          font-size:16px;
          color:rgba(228,210,255,.9);
          margin-bottom:14px;
        }

        .od-modal-btns{
          display:flex;
          gap:10px;
          margin-top:16px;
        }

        .od-modal-cancel{
          flex:1;
          padding:10px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(160,96,240,.18);
          border-radius:10px;
          color:rgba(200,165,255,.6);
          font-family:'Montserrat',sans-serif;
          font-size:12px;
          cursor:pointer;
        }

        .od-modal-confirm{
          flex:1;
          padding:10px;
          background:rgba(240,80,80,.18);
          border:1px solid rgba(240,80,80,.3);
          border-radius:10px;
          color:#f08080;
          font-family:'Montserrat',sans-serif;
          font-size:12px;
          font-weight:600;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
        }

        .od-modal-confirm:disabled{
          opacity:.5;
          cursor:not-allowed;
        }

        .od-no-rest{
          padding:60px 32px;
          text-align:center;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:14px;
        }

        .od-no-rest-ic{
          width:60px;
          height:60px;
          border-radius:16px;
          background:rgba(160,96,240,.1);
          border:1px solid rgba(160,96,240,.2);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:26px;
        }

        .od-no-rest-title{
          font-family:'Cinzel',serif;
          font-size:16px;
          color:rgba(200,165,255,.6);
          letter-spacing:.06em;
        }

        .od-no-rest-sub{
          font-size:12px;
          color:rgba(180,140,255,.3);
          max-width:300px;
          line-height:1.65;
        }

        .od-toast{
          position:fixed;
          bottom:26px;
          left:50%;
          transform:translateX(-50%);
          z-index:9999;
          padding:10px 20px;
          border-radius:12px;
          font-family:'Montserrat',sans-serif;
          font-size:12px;
          font-weight:500;
          white-space:nowrap;
          animation:od-toast .3s ease both;
          backdrop-filter:blur(20px);
        }

        .od-toast.success{
          background:rgba(40,180,100,.18);
          border:1px solid rgba(40,180,100,.3);
          color:#60e0a0;
        }

        .od-toast.error{
          background:rgba(220,60,60,.18);
          border:1px solid rgba(220,60,60,.3);
          color:#f08080;
        }

        .od-uploading{
          display:flex;
          align-items:center;
          gap:7px;
          font-size:11px;
          color:rgba(180,140,255,.5);
        }

        .od-empty{
          padding:40px;
          text-align:center;
          color:rgba(180,140,255,.28);
          font-size:12px;
        }

        @media (max-width: 1280px){
          .od-analytics-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
          .od-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
          .od-three-grid{grid-template-columns:1fr}
        }

        @media (max-width: 1100px){
          .od-two-grid{grid-template-columns:1fr}
          .od-grid4{grid-template-columns:1fr 1fr}
        }

        @media (max-width: 920px){
          .od-sb{display:none}
          .od-content{padding:18px}
          .od-analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .od-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .od-grid2{grid-template-columns:1fr}
        }

        @media (max-width: 640px){
          .od-analytics-grid{grid-template-columns:1fr}
          .od-stat-grid{grid-template-columns:1fr}
          .od-grid4{grid-template-columns:1fr}
          .od-tb{padding:0 14px}
          .od-content{padding:14px}
        }

        /* ════════════ LIGHT THEME ════════════ */
        .od-root.light { background:#f8fafc; color:#0f172a; }
        .od-root.light .od-sb { background:#ffffff; border-color:rgba(203,213,225,0.6); }
        .od-root.light .od-sb-logo { border-bottom-color:rgba(203,213,225,0.6); }
        .od-root.light .od-logo-tx { color:#0f172a; }
        .od-root.light .od-ni { color:#475569; }
        .od-root.light .od-ni:hover { background:#f1f5f9; color:#0f172a; }
        .od-root.light .od-ni.active { background:#f3e8ff; color:#7e22ce; }
        .od-root.light .od-sb-ft { border-top-color:rgba(203,213,225,0.6); }
        
        .od-root.light .od-tb { background:#ffffff; border-bottom-color:rgba(203,213,225,0.6); }
        .od-root.light .od-pt { color:#0f172a; }
        .od-root.light .od-chip { background:#f1f5f9; border-color:rgba(203,213,225,0.6); }
        .od-root.light .od-chip-lb { color:#475569; }
        
        .od-root.light .od-card { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.03); }
        .od-root.light .od-card:hover { border-color:rgba(168,85,247,0.3); box-shadow:0 12px 24px rgba(0,0,0,0.06); }
        .od-root.light .od-card-title { color:#0f172a; font-weight:600; }
        
        .od-root.light .od-stat { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.02); }
        .od-root.light .od-stat-lb { color:#64748b; }
        
        .od-root.light .od-metric-card, .od-root.light .od-insight, .od-root.light .od-progress-card { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.02); }
        .od-root.light .od-metric-kicker, .od-root.light .od-insight-top { color:#64748b; }
        .od-root.light .od-metric-value, .od-root.light .od-insight-value { color:#0f172a; }
        .od-root.light .od-metric-sub, .od-root.light .od-insight-sub { color:#475569; }
        .od-root.light .od-progress-top { color:#0f172a; }
        .od-root.light .od-progress-track { background:#f1f5f9; }
        
        .od-root.light .od-table th { color:#64748b; border-bottom-color:rgba(203,213,225,0.6); }
        .od-root.light .od-table td { color:#475569; border-bottom-color:rgba(203,213,225,0.3); }
        .od-root.light .od-table tr:hover td { background:#f8fafc; }
        
        .od-root.light .od-un { color:#0f172a; }
        .od-root.light .od-ue { color:#64748b; }
        
        .od-root.light .od-filter-pill { background:#f1f5f9; border-color:rgba(203,213,225,0.6); color:#64748b; }
        .od-root.light .od-filter-pill.active { background:#f3e8ff; border-color:rgba(168,85,247,0.4); color:#7e22ce; }
        
        .od-root.light .od-label { color:#64748b; }
        .od-root.light .od-input, .od-root.light .od-textarea, .od-root.light .od-select, .od-root.light .od-modal-input { background:#f8fafc; border-color:rgba(203,213,225,0.8); color:#0f172a; }
        .od-root.light .od-input:focus, .od-root.light .od-textarea:focus, .od-root.light .od-modal-input:focus { border-color:rgba(168,85,247,0.5); background:#ffffff; box-shadow:0 0 0 3px rgba(168,85,247,0.1); }
        
        .od-root.light .od-chart-xlabel { color:#64748b; }
        .od-root.light .od-bar-col { color:#64748b; }
        .od-root.light .od-bar-top-value { color:#0f172a; }
        
        .od-root.light .od-modal { background:#ffffff; border-color:rgba(203,213,225,0.8); box-shadow:0 24px 60px rgba(0,0,0,0.1); }
        .od-root.light .od-modal-title { color:#0f172a; }
        
        .od-root.light .od-bk-card { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.02); }
        .od-root.light .od-bk-card:hover { background:#f8fafc; border-color:rgba(168,85,247,0.3); }
        .od-root.light .od-bk-details { background:#f8fafc; border-color:rgba(203,213,225,0.6); }
        .od-root.light .od-bk-detail { color:#475569; }
      `}</style>

      <div className={`od-root${!isDark ? " light" : ""}`}>
        <aside className="od-sb">
          <a className="od-sb-logo" href="/dashboard">
            <div className="od-logo-ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 2v7c0 1.1.9 2 2 2h4v11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 2v20M18 2v6a4 4 0 01-4 4v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="od-logo-tx">TableTime</span>
            <span className="od-logo-bd">Owner</span>
          </a>

          {/* Subscription Plan Badge */}
          <div style={{ padding: "0 18px", marginBottom: "18px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: userPlan.includes("platinum") || userPlan.includes("diamond")
                ? "linear-gradient(135deg, rgba(212,175,55,.15), rgba(255,215,0,.08))"
                : userPlan.includes("gold")
                ? "linear-gradient(135deg, rgba(255,193,7,.15), rgba(255,193,7,.06))"
                : "linear-gradient(135deg, rgba(160,96,240,.15), rgba(100,180,255,.06))",
              border: `1px solid ${
                userPlan.includes("platinum") || userPlan.includes("diamond") ? "rgba(212,175,55,.35)"
                : userPlan.includes("gold") ? "rgba(255,193,7,.3)"
                : "rgba(160,96,240,.25)"
              }`,
              borderRadius: "10px", padding: "8px 12px",
            }}>
              <span style={{ fontSize: "18px" }}>
                {userPlan.includes("platinum") || userPlan.includes("diamond") ? "💎"
                  : userPlan.includes("gold") ? "🥇" : "🥈"}
              </span>
              <div>
                <div style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                  color: userPlan.includes("platinum") || userPlan.includes("diamond") ? "#f0d060"
                    : userPlan.includes("gold") ? "#ffc107" : "#a060f0"
                }}>
                  {userPlan.includes("platinum") || userPlan.includes("diamond") ? "Platinum Plan"
                    : userPlan.includes("gold") ? "Gold Plan" : "Silver Plan"}
                </div>
                <div style={{ fontSize: "9px", color: "rgba(200,170,255,.4)", marginTop: "1px" }}>
                  {userPlan.includes("platinum") || userPlan.includes("diamond") ? "Up to 8 restaurants"
                    : userPlan.includes("gold") ? "Up to 5 restaurants" : "1 restaurant"}
                </div>
              </div>
            </div>
          </div>

          {/* Active View Selector */}
          <div style={{ padding: "0 18px", marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", color: "rgba(200,165,255,.4)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>Active Restaurant</div>
            <select
              style={{
                width: "100%", background: "rgba(30,15,55,.95)", border: "1px solid rgba(160,96,240,.25)",
                borderRadius: "8px", color: "#efe8ff", padding: "8px 10px", fontSize: "12px", outline: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", appearance: "auto"
              }}
              value={activeResId}
              onChange={(e) => {
                const val = e.target.value;
                setActiveResId(val);
                if (val === "all") {
                  setRestaurant(null);
                  setFoodItems(allRestaurantFoodItems); // Restore all food items
                } else {
                  const sel = restaurants.find(r => r._id === val);
                  if (sel) {
                    setRestaurant(sel);
                    // Filter food items for this specific restaurant
                    setFoodItems(allRestaurantFoodItems.filter((f: any) =>
                      f.restaurant === val || f.restaurant?._id === val
                    ));
                  }
                }
              }}
            >
              {/* Show "All" only if Gold or Platinum */}
              {(userPlan.includes("gold") || userPlan.includes("platinum") || userPlan.includes("diamond")) && (
                <option value="all" style={{background: "#0d0622"}}>🌍 All Restaurants (Portfolio)</option>
              )}
              {restaurants.map(r => (
                <option key={r._id} value={r._id} style={{background: "#0d0622"}}>🏠 {r.name}</option>
              ))}
            </select>
          </div>

          <nav className="od-nav">
            {([
              {
                id: "overview",
                label: "My Restaurant",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ),
              },
              {
                id: "bookings",
                label: "Bookings",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
                badge: tablePendingCount,
              },
              {
                id: "delivery",
                label: "Delivery Orders",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ),
                badge: deliveryPendingCount,
              },
              {
                id: "menu",
                label: "Manage Menu",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                id: "nightlife",
                label: "Nightlife & Events",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                ),
              },
            ] as {
              id: Tab;
              label: string;
              icon: React.ReactNode;
              badge?: number;
            }[])
            .filter((t) => {
              if (userPlan === "silver" && (t.id === "delivery" || t.id === "menu")) return false;
              if (userPlan === "gold" && t.id === "delivery") return false;
              if (activeResId === "all" && t.id === "menu") return false;
              return true;
            })
            .map((item) => (
              <button
                key={item.id}
                className={`od-ni${tab === item.id ? " active" : ""}`}
                onClick={() => { setTab(item.id); setBookFilter("all"); }}
              >
                <span className="od-ni-ic">{item.icon}</span>
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="od-ni-badge">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="od-sb-ft">
            <button className="od-logout" onClick={handleLogout}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.6 }}
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </aside>

        <main className="od-main">
          <div className="od-tb" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="od-pt">
              {tab === "overview" && activeResId === "all"
                ? "Portfolio Overview"
                : tab === "overview"
                ? "My Restaurant"
                : tab === "bookings"
                ? "Bookings"
                : "Manage Menu"}
            </span>

            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              {tab === "overview" && (
                <button
                  className="od-btn od-btn-confirm"
                  style={{ gap: 6, padding: "8px 16px", borderRadius: "8px" }}
                  onClick={() => setShowAddResModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add New Restaurant
                </button>
              )}

              <div className="od-chip">
              {ownerPic ? (
                <img
                  src={ownerPic}
                  alt={ownerName}
                  referrerPolicy="no-referrer"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#059669,#10b981)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {ownerInitial}
                </div>
              )}
              <span className="od-chip-lb">{ownerName}</span>
            </div>
            </div>
          </div>

          <div className="od-content">
            {!restaurant && activeResId !== "all" && (
              <div className="od-card">
                <div className="od-no-rest">
                  <div className="od-no-rest-ic">🍽️</div>
                  <div className="od-no-rest-title">No Restaurant Assigned</div>
                  <div className="od-no-rest-sub">
                    Click "Add New Restaurant" at the top right to start your portfolio.
                  </div>
                </div>
              </div>
            )}

            {(restaurant || activeResId === "all") && tab === "overview" && (
              <>
                {activeResId !== "all" && restaurant && (
                  <div className="od-rest-card">
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="od-rest-banner"
                      />
                    ) : (
                      <div className="od-rest-banner-placeholder">🍽️</div>
                    )}

                    <div className="od-rest-info">
                      <div className="od-rest-name">{restaurant.name}</div>
                      <div className="od-rest-meta">
                        <span>📍 {restaurant.city}</span>
                        <span
                          className={`od-rest-tag${
                            restaurant.isActive ? " od-rest-active" : ""
                          }`}
                        >
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </span>
                        <span>{restaurant.priceRange}</span>
                        {restaurant.openingTime && (
                          <span>
                            🕐 {restaurant.openingTime} – {restaurant.closingTime}
                          </span>
                        )}
                      </div>

                      <div className="od-stat-grid">
                        {[
                          { num: foodItems.length, lb: "Menu Items" },
                          {
                            num: foodItems.filter((f) => f.isAvailable).length,
                            lb: "Available",
                          },
                          { num: pendingCount, lb: "Pending Bookings" },
                          { num: newPendingCount, lb: "New Pending" },
                          { num: analytics.totalReservations, lb: "Reservations" },
                          { num: analytics.totalGuests, lb: "Guests" },
                          { num: analytics.occupancy + "%", lb: "Occupancy" },
                          { num: restaurant.rating || 0, lb: "Rating" },
                        ].map((s) => (
                          <div key={s.lb} className="od-stat">
                            <div className="od-stat-num">{s.num}</div>
                            <div className="od-stat-lb">{s.lb}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="od-card">
                  <div className="od-card-hd">
                    <span className="od-card-title">Business Overview</span>
                  </div>

                  <div className="od-analytics-grid">
                    {[
                      {
                        title: "Total Reservations",
                        value: analytics.totalReservations,
                        sub: "All bookings created so far",
                      },
                      {
                        title: "Confirmed Reservations",
                        value: analytics.confirmed,
                        sub: "Accepted by you",
                      },
                      {
                        title: "Rejected Reservations",
                        value: analytics.rejected,
                        sub: "Declined bookings",
                      },
                      {
                        title: "Cancelled Reservations",
                        value: analytics.cancelled,
                        sub: "User cancelled bookings",
                      },
                      {
                        title: "Total Guests",
                        value: analytics.totalGuests,
                        sub: "All guest count across reservations",
                      },
                      {
                        title: "Avg Guests / Reservation",
                        value: analytics.avgGuestsPerReservation,
                        sub: "Useful for seating planning",
                      },
                      {
                        title: "Today Reservations",
                        value: analytics.todayReservations,
                        sub: "Bookings for today",
                      },
                      {
                        title: "Today Revenue",
                        value: formatCurrency(analytics.todayRevenue),
                        sub: "Confirmed revenue today",
                      },
                      {
                        title: "Total Revenue",
                        value: formatCurrency(analytics.totalRevenue),
                        sub: "Overall confirmed revenue",
                      },
                      {
                        title: "Occupancy",
                        value: `${analytics.occupancy}%`,
                        sub: `Based on seating capacity ${analytics.seatingCapacity}`,
                      },
                      {
                        title: "Staffing Need",
                        value: analytics.suggestedStaffOnShift,
                        sub: "Suggested floor staff on shift",
                      },
                      {
                        title: "Pending Approval",
                        value: analytics.pending,
                        sub: "Reservations waiting for action",
                      },
                    ].map((item) => (
                      <div key={item.title} className="od-metric-card">
                        <div className="od-metric-kicker">{item.title}</div>
                        <div className="od-metric-value">{item.value}</div>
                        <div className="od-metric-sub">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="od-two-grid">
                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Reservations Trend (Last 7 Days)</span>
                    </div>
                    <MiniLineChart
                      data={analytics.last7Days.map((d) => ({
                        label: d.label,
                        value: d.reservations,
                      }))}
                    />
                  </div>

                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Revenue Trend (Last 7 Days)</span>
                    </div>
                    <MiniBarChart
                      data={analytics.last7Days.map((d) => ({
                        label: d.label,
                        value: d.revenue,
                      }))}
                      color="linear-gradient(180deg,#10b981,#059669)"
                    />
                  </div>
                </div>

                {activeResId === "all" && userPlan === "platinum" && portfolioComparison.length > 0 && (
                  <div className="od-two-grid">
                    <div className="od-card">
                      <div className="od-card-hd">
                        <span className="od-card-title">Portfolio: Reservations by Branch</span>
                      </div>
                      <MiniBarChart
                        data={portfolioComparison.map((d) => ({
                          label: d.label,
                          value: d.reservations,
                        }))}
                        color="linear-gradient(180deg,#7030d0,#a060f0)"
                      />
                    </div>

                    <div className="od-card">
                      <div className="od-card-hd">
                        <span className="od-card-title">Portfolio: Revenue by Branch</span>
                      </div>
                      <MiniBarChart
                        data={portfolioComparison.map((d) => ({
                          label: d.label,
                          value: d.revenue,
                        }))}
                        color="linear-gradient(180deg,#10b981,#059669)"
                      />
                    </div>
                  </div>
                )}

                <div className="od-three-grid">
                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Booking Distribution</span>
                    </div>
                    <div className="od-progress-wrap">
                      <ProgressMetric
                        label="Pending"
                        value={analytics.totalReservations ? Math.round((analytics.pending / analytics.totalReservations) * 100) : 0}
                        color="linear-gradient(90deg,#fbbf24,#f59e0b)"
                      />
                      <ProgressMetric
                        label="Confirmed"
                        value={analytics.totalReservations ? Math.round((analytics.confirmed / analytics.totalReservations) * 100) : 0}
                        color="linear-gradient(90deg,#10b981,#34d399)"
                      />
                      <ProgressMetric
                        label="Rejected"
                        value={analytics.totalReservations ? Math.round((analytics.rejected / analytics.totalReservations) * 100) : 0}
                        color="linear-gradient(90deg,#ef4444,#f87171)"
                      />
                      <ProgressMetric
                        label="Cancelled"
                        value={analytics.totalReservations ? Math.round((analytics.cancelled / analytics.totalReservations) * 100) : 0}
                        color="linear-gradient(90deg,#94a3b8,#64748b)"
                      />
                    </div>
                  </div>

                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Operations Snapshot</span>
                    </div>
                    <div className="od-info-stack">
                      <div className="od-insight">
                        <div className="od-insight-top">Guests Today</div>
                        <div className="od-insight-value">{analytics.todayGuests}</div>
                        <div className="od-insight-sub">
                          Total reserved guests for today.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Confirmed Guests</div>
                        <div className="od-insight-value">{analytics.confirmedGuests}</div>
                        <div className="od-insight-sub">
                          Accepted guest count across all bookings.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Total Orders Today</div>
                        <div className="od-insight-value">
                          {analytics.todayReservations}
                        </div>
                        <div className="od-insight-sub">
                          Combined dining and delivery count for today.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Staffing & Economy Notes</span>
                    </div>
                    <div className="od-info-stack">
                      <div className="od-insight">
                        <div className="od-insight-top">Suggested Floor Staff</div>
                        <div className="od-insight-value">
                          {analytics.suggestedStaffOnShift}
                        </div>
                        <div className="od-insight-sub">
                          Staff volume prediction based on daily reservation load.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Occupancy Rate</div>
                        <div className="od-insight-value">{analytics.occupancy}%</div>
                        <div className="od-insight-sub">
                          Live occupancy index versus total floor seating capacity.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Average Spend / Guest</div>
                        <div className="od-insight-value">
                          {formatCurrency(analytics.avgSpendPerGuest)}
                        </div>
                        <div className="od-insight-sub">
                          Gross revenue divided by confirmed guest headcount.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {bookings.filter((b) => b.status === "pending").length > 0 && (
                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">⏳ Pending Requests</span>
                      <button
                        className="od-btn od-btn-confirm"
                        onClick={() => setTab("bookings")}
                      >
                        View All
                      </button>
                    </div>

                    <div
                      style={{
                        padding: "12px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {bookings
                        .filter((b) => b.status === "pending")
                        .slice(0, 3)
                        .map((b) => (
                          <div
                            key={b._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              background: "rgba(251,191,36,.05)",
                              border: "1px solid rgba(251,191,36,.12)",
                              borderRadius: 10,
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "rgba(228,210,255,.85)",
                                }}
                              >
                                {b.user?.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "rgba(200,170,255,.45)",
                                  marginTop: 2,
                                }}
                              >
                                {getBookingKindLabel(b)} · {formatShortDate(b.date)}{b.orderType === "delivery" ? ` · ${b.foodItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} item(s)` : ` · ${b.timeSlot} · ${b.guests} guests`}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="od-btn od-btn-confirm"
                                disabled={actionLoading === b._id + "confirmed"}
                                onClick={() => handleBookingAction(b._id, "confirmed")}
                              >
                                {actionLoading === b._id + "confirmed" ? (
                                  <span className="od-spinner" />
                                ) : (
                                  "✓ Confirm"
                                )}
                              </button>
                              <button
                                className="od-btn od-btn-reject"
                                onClick={() => setRejectModal({ id: b._id })}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {foodItems.length > 0 && (
                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Menu Items</span>
                      <span style={{ fontSize: 11, color: "rgba(180,140,255,.4)" }}>
                        {foodItems.length} items
                      </span>
                    </div>

                    <table className="od-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foodItems.slice(0, 6).map((f) => (
                          <tr key={f._id}>
                            <td>
                              <div className="od-uc">
                                {f.image ? (
                                  <img src={f.image} alt={f.name} className="od-item-img" />
                                ) : (
                                  <div className="od-item-img-ph">🍱</div>
                                )}
                                <div>
                                  <div className="od-un">{f.name}</div>
                                  <div className="od-ue">{f.spicyLevel}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: 11, color: "rgba(180,140,255,.5)" }}>
                              {f.category}
                            </td>
                            <td style={{ color: "#c090ff", fontFamily: "'Cinzel',serif" }}>
                              ₹{f.price}
                            </td>
                            <td style={{ fontSize: 11 }}>{f.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}</td>
                            <td>
                              <button
                                className={f.isAvailable ? "od-status-on" : "od-status-off"}
                                onClick={() => toggleFood(f._id)}
                              >
                                {f.isAvailable ? "Available" : "Unavailable"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {restaurant && (tab === "bookings" || tab === "delivery") && (
              <div className="od-card">
                <div className="od-card-hd">
                  <span className="od-card-title">
                    {tab === "delivery" ? "🚚 Delivery Orders" : "📅 Table Bookings"}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="od-filter-bar">
                      {(tab === "delivery"
                        ? (["all", "pending", "confirmed", "preparing", "out_for_delivery", "delivered", "rejected", "cancelled"] as const)
                        : (["all", "pending", "confirmed", "rejected", "cancelled"] as const)
                      ).map(
                        (f) => (
                          <button
                            key={f}
                            className={`od-filter-pill${bookFilter === f ? " active" : ""}`}
                            onClick={() => setBookFilter(f)}
                          >
                            {(f === "all"
                              ? "All"
                              : f === "out_for_delivery"
                              ? "Out for Delivery"
                              : f === "delivered"
                              ? "Delivered"
                              : f === "preparing"
                              ? "Preparing"
                              : f.charAt(0).toUpperCase() + f.slice(1))}{" "}
                            ({bookCounts[f]})
                          </button>
                        )
                      )}
                    </div>

                    <button className="od-btn od-btn-confirm" onClick={fetchBookings}>
                      {bookLoading ? <span className="od-spinner" /> : "↻ Refresh"}
                    </button>
                  </div>
                </div>

                <div style={{ padding: "16px 18px" }}>
                  {bookLoading ? (
                    <div className="od-empty">Loading bookings...</div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="od-empty">
                      {bookFilter === "all"
                        ? (tab === "delivery" ? "No delivery orders yet" : "No table bookings yet")
                        : `No ${bookFilter} ${tab === "delivery" ? "delivery orders" : "bookings"}`}
                    </div>
                  ) : (
                    filteredBookings.map((b, i) => {
                      const s = STATUS_STYLE[b.status];
                      const pay = PAYMENT_STYLE[b.paymentStatus || "pending"] || PAYMENT_STYLE.pending;
                      const nextOwnerStatus = getNextOwnerStatus(b);
                      const canConfirm = b.status === "pending";
                      const canReject = b.status === "pending";
                      const canProgressDelivery = !!nextOwnerStatus;

                      return (
                        <div
                          key={b._id}
                          className="od-bk-card"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <div className="od-bk-top">
                            <div className="od-user-av">
                              {b.user?.picture ? (
                                <img
                                  src={b.user.picture}
                                  alt={b.user.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                b.user?.name?.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <div>
                                  <div className="od-un">{b.user?.name}</div>
                                  <div className="od-ue">{b.user?.email}</div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      padding: "4px 12px",
                                      borderRadius: 20,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      background: s.bg,
                                      border: `1px solid ${s.border}`,
                                      color: s.color,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {s.label}
                                  </span>

                                  <span
                                    style={{
                                      padding: "4px 12px",
                                      borderRadius: 20,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      background: pay.bg,
                                      border: `1px solid ${pay.border}`,
                                      color: pay.color,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {pay.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="od-bk-details">
                            {[
                              {
                                icon: (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  >
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                  </svg>
                                ),
                                val: formatLongDate(b.date),
                              },
                              {
                                icon: (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M3 7h18M6 3v4M18 3v4M5 11h14v8H5z" />
                                  </svg>
                                ),
                                val: getBookingKindLabel(b),
                              },
                              {
                                icon: (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                  </svg>
                                ),
                                val: b.orderType === "delivery" ? (b.deliveryDetails?.deliverySlot || "ASAP Delivery") : b.timeSlot,
                              },
                              {
                                icon: (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  >
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                    <path d="M16 3.13a4 4 0 010 7.75" />
                                  </svg>
                                ),
                                val: b.orderType === "delivery"
                                  ? `${b.foodItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} item(s)`
                                  : `${b.guests} guest${b.guests !== 1 ? "s" : ""}`,
                              },
                              {
                                icon: (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M3 12h18M5 12l3-4M19 12l-3-4M5 12l3 4M19 12l-3 4" />
                                  </svg>
                                ),
                                val: formatCurrency(b.totalAmount || 0),
                              },
                              {
                                icon: (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                  </svg>
                                ),
                                val: `Placed ${formatShortDate(b.createdAt)}`,
                              },
                            ].map((d, idx) => (
                              <div key={idx} className="od-bk-detail">
                                {d.icon}
                                {d.val}
                              </div>
                            ))}
                          </div>

                          {b.specialRequest && (
                            <div className="od-bk-special">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                style={{ flexShrink: 0, marginTop: 1 }}
                              >
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                              </svg>
                              {b.specialRequest}
                            </div>
                          )}
                          )

                          {b.orderType === "delivery" && (
                            <>
                              <div className="od-bk-special">
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  style={{ flexShrink: 0, marginTop: 1 }}
                                >
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <path d="M3.3 7l8.7 5 8.7-5" />
                                  <path d="M12 22V12" />
                                </svg>
                                <div>
                                  <div style={{ color: "rgba(228,210,255,.84)", marginBottom: 4 }}>
                                    {b.deliveryDetails?.fullName || b.user?.name} · {b.deliveryDetails?.phone || "No phone"}
                                  </div>
                                  <div style={{ lineHeight: 1.6 }}>
                                    {[
                                      b.deliveryDetails?.addressLine1,
                                      b.deliveryDetails?.addressLine2,
                                      b.deliveryDetails?.landmark,
                                      b.deliveryDetails?.city,
                                      b.deliveryDetails?.state,
                                      b.deliveryDetails?.pincode,
                                    ]
                                      .filter(Boolean)
                                      .join(", ") || "No delivery address"}
                                  </div>
                                </div>
                              </div>

                              {!!b.foodItems?.length && (
                                <div className="od-bk-special">
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    style={{ flexShrink: 0, marginTop: 1 }}
                                  >
                                    <path d="M4 6h16M7 12h10M10 18h4" />
                                  </svg>
                                  <div style={{ lineHeight: 1.7 }}>
                                    {b.foodItems
                                      .map((item) => `${item.name} × ${item.quantity}`)
                                      .join(" • ")}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {(canConfirm || canReject || canProgressDelivery) && (
                            <div className="od-bk-actions">
                              {canConfirm && (
                                <button
                                  className="od-btn od-btn-confirm"
                                  disabled={actionLoading === b._id + "confirmed"}
                                  onClick={() => handleBookingAction(b._id, "confirmed")}
                                >
                                  {actionLoading === b._id + "confirmed" ? (
                                    <>
                                      <span className="od-spinner" /> Confirming...
                                    </>
                                  ) : b.orderType === "delivery" ? (
                                    "✓ Accept Order"
                                  ) : (
                                    "✓ Confirm Booking"
                                  )}
                                </button>
                              )}

                              {canProgressDelivery && nextOwnerStatus && (
                                <button
                                  className="od-btn od-btn-confirm"
                                  disabled={actionLoading === b._id + nextOwnerStatus}
                                  onClick={() => handleBookingAction(b._id, nextOwnerStatus)}
                                  style={{
                                    background: "rgba(96,165,250,.12)",
                                    color: "#93c5fd",
                                    border: "1px solid rgba(96,165,250,.24)",
                                  }}
                                >
                                  {actionLoading === b._id + nextOwnerStatus ? (
                                    <>
                                      <span className="od-spinner" /> Updating...
                                    </>
                                  ) : (
                                    getOwnerActionLabel(b.status)
                                  )}
                                </button>
                              )}

                              {canReject && (
                                <button
                                  className="od-btn od-btn-reject"
                                  disabled={!!actionLoading}
                                  onClick={() => setRejectModal({ id: b._id })}
                                >
                                  ✗ Reject
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {restaurant && tab === "menu" && (
              <>
                <div className="od-card">
                  <div className="od-card-hd">
                    <span className="od-card-title">Add Food Item</span>
                    {imgUploading && (
                      <div className="od-uploading">
                        <span className="od-spinner" />
                        Uploading...
                      </div>
                    )}
                  </div>

                  <form className="od-form" onSubmit={handleAddFood}>
                    <div className="od-grid2">
                      <div className="od-field">
                        <label className="od-label">Food Photo</label>
                        <div className="od-img-wrap">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageUpload(e.target.files[0]);
                              }
                            }}
                          />
                          {foodImgPreview ? (
                            <img
                              src={foodImgPreview}
                              alt="preview"
                              className="od-img-preview"
                            />
                          ) : (
                            <div className="od-img-ph">
                              📷<span>Click to upload</span>
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          margin: "8px 0 4px",
                        }}>
                          <div style={{
                            flex: 1,
                            height: 1,
                            background: "rgba(160,96,240,.18)",
                          }} />
                          <span style={{
                            fontSize: 10,
                            color: "rgba(180,140,255,.4)",
                            letterSpacing: ".1em",
                            textTransform: "uppercase" as const,
                            fontWeight: 600,
                          }}>
                            or paste url
                          </span>
                          <div style={{
                            flex: 1,
                            height: 1,
                            background: "rgba(160,96,240,.18)",
                          }} />
                        </div>

                        <div style={{ position: "relative" }}>
                          <input
                            className="od-input"
                            type="url"
                            placeholder="https://example.com/food-image.jpg"
                            value={foodForm.image && !foodForm.imagePublicId ? foodForm.image : ""}
                            onChange={(e) => {
                              const url = e.target.value;
                              setFoodForm((p) => ({
                                ...p,
                                image: url,
                                imagePublicId: "",
                              }));
                              setFoodImgPreview(url);
                            }}
                            style={{ paddingLeft: 34 }}
                          />
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              position: "absolute",
                              left: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "rgba(180,140,255,.35)",
                              pointerEvents: "none",
                            }}
                          >
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                          </svg>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="od-field">
                          <label className="od-label">Item Name *</label>
                          <input
                            className="od-input"
                            placeholder="e.g. Butter Chicken"
                            value={foodForm.name}
                            onChange={(e) =>
                              setFoodForm((p) => ({ ...p, name: e.target.value }))
                            }
                            required
                          />
                        </div>

                        <div className="od-field">
                          <label className="od-label">Description</label>
                          <textarea
                            className="od-textarea"
                            style={{ minHeight: 60 }}
                            placeholder="Short description..."
                            value={foodForm.description}
                            onChange={(e) =>
                              setFoodForm((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="od-grid4">
                      <div className="od-field">
                        <label className="od-label">Price (₹) *</label>
                        <input
                          className="od-input"
                          type="number"
                          min="0"
                          placeholder="299"
                          value={foodForm.price}
                          onChange={(e) =>
                            setFoodForm((p) => ({ ...p, price: e.target.value }))
                          }
                          required
                        />
                      </div>

                      <div className="od-field">
                        <label className="od-label">Offer (%)</label>
                        <input
                          className="od-input"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={foodForm.offer}
                          onChange={(e) =>
                            setFoodForm((p) => ({ ...p, offer: e.target.value }))
                          }
                        />
                      </div>

                      <div className="od-field">
                        <label className="od-label">Category</label>
                        <select
                          className="od-select"
                          value={foodForm.category}
                          onChange={(e) =>
                            setFoodForm((p) => ({
                              ...p,
                              category: e.target.value,
                            }))
                          }
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="od-field">
                        <label className="od-label">Spicy Level</label>
                        <select
                          className="od-select"
                          value={foodForm.spicyLevel}
                          onChange={(e) =>
                            setFoodForm((p) => ({
                              ...p,
                              spicyLevel: e.target.value,
                            }))
                          }
                        >
                          {SPICY_LEVELS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="od-grid2">
                      <div className="od-field">
                        <label className="od-label">Food Type</label>
                        <div className="od-veg-row">
                          <button
                            type="button"
                            className={`od-veg-pill veg${foodForm.isVeg ? " sel" : ""}`}
                            onClick={() =>
                              setFoodForm((p) => ({ ...p, isVeg: true }))
                            }
                          >
                            🟢 Veg
                          </button>
                          <button
                            type="button"
                            className={`od-veg-pill nonveg${!foodForm.isVeg ? " sel" : ""}`}
                            onClick={() =>
                              setFoodForm((p) => ({ ...p, isVeg: false }))
                            }
                          >
                            🔴 Non-Veg
                          </button>
                        </div>
                      </div>

                      <div className="od-field">
                        <label className="od-label">Availability</label>
                        <div className="od-toggle-wrap" style={{ marginTop: 6 }}>
                          <button
                            type="button"
                            className={`od-toggle ${foodForm.isAvailable ? "on" : "off"}`}
                            onClick={() =>
                              setFoodForm((p) => ({
                                ...p,
                                isAvailable: !p.isAvailable,
                              }))
                            }
                          >
                            <div className="od-toggle-knob" />
                          </button>
                          <span className="od-toggle-lb">
                            {foodForm.isAvailable ? "Available" : "Not Available"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className="od-submit"
                        type="submit"
                        disabled={submitting || imgUploading}
                      >
                        {submitting ? (
                          <>
                            <span className="od-spinner" /> Adding...
                          </>
                        ) : (
                          "+ Add Item"
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="od-card">
                  <div className="od-card-hd">
                    <span className="od-card-title">All Menu Items</span>
                    <span style={{ fontSize: 11, color: "rgba(180,140,255,.4)" }}>
                      {foodItems.length} items
                    </span>
                  </div>

                  {foodItems.length === 0 ? (
                    <div className="od-empty">No items yet</div>
                  ) : (
                    <table className="od-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Offer</th>
                          <th>Type</th>
                          <th>Spicy</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foodItems.map((f) => (
                          <tr key={f._id}>
                            <td>
                              <div className="od-uc">
                                {f.image ? (
                                  <img src={f.image} alt={f.name} className="od-item-img" />
                                ) : (
                                  <div className="od-item-img-ph">🍱</div>
                                )}
                                <div>
                                  <div className="od-un">{f.name}</div>
                                  <div className="od-ue">
                                    {f.description?.slice(0, 35)}
                                    {f.description?.length > 35 ? "..." : ""}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ fontSize: 11, color: "rgba(180,140,255,.5)" }}>
                              {f.category}
                            </td>

                            <td style={{ color: "#c090ff", fontFamily: "'Cinzel',serif" }}>
                              ₹{f.price}
                            </td>

                            <td>
                              {f.offer > 0 ? (
                                <span style={{ color: "#60d090", fontSize: 11 }}>
                                  {f.offer}% off
                                </span>
                              ) : (
                                <span style={{ color: "rgba(180,140,255,.3)" }}>—</span>
                              )}
                            </td>

                            <td style={{ fontSize: 11 }}>{f.isVeg ? "🟢" : "🔴"}</td>

                            <td style={{ fontSize: 11, color: "rgba(180,140,255,.5)" }}>
                              {f.spicyLevel}
                            </td>

                            <td>
                              <button
                                className={f.isAvailable ? "od-status-on" : "od-status-off"}
                                onClick={() => toggleFood(f._id)}
                              >
                                {f.isAvailable ? "Available" : "Unavailable"}
                              </button>
                            </td>

                            <td>
                              <button
                                className="od-btn"
                                style={{
                                  background: "rgba(96,165,250,.12)",
                                  color: "#93c5fd",
                                  border: "1px solid rgba(96,165,250,.24)",
                                }}
                                onClick={() => handleEditFood(f)}
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
            {restaurant && tab === "nightlife" && (
              <OwnerNightlifeManager restaurant={restaurant} onUpdate={fetchMyRestaurants} />
            )}
          </div>
        </main>
      </div>

      {rejectModal && (
        <div
          className="od-modal-overlay"
          onClick={() => {
            setRejectModal(null);
            setRejectReason("");
          }}
        >
          <div className="od-modal" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-title">✗ Reject Booking</div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(200,170,255,.45)",
                marginBottom: 12,
              }}
            >
              Provide a reason (optional) — user will see this.
            </div>

            <textarea
              className="od-modal-input"
              placeholder="e.g. Restaurant fully booked on this date..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="od-modal-btns">
              <button
                className="od-modal-cancel"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>

              <button
                className="od-modal-confirm"
                disabled={actionLoading === rejectModal.id + "rejected"}
                onClick={() =>
                  handleBookingAction(rejectModal.id, "rejected", rejectReason)
                }
              >
                {actionLoading === rejectModal.id + "rejected" ? (
                  <>
                    <span className="od-spinner" /> Rejecting...
                  </>
                ) : (
                  "Confirm Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingFood && (
        <div
          className="od-modal-overlay"
          onClick={() => setEditingFood(null)}
        >
          <div
            className="od-modal"
            style={{ maxWidth: 560, border: "1px solid rgba(96,165,250,.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="od-modal-title">✏️ Edit Food Item</div>
            <form onSubmit={handleUpdateFood} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="od-grid2">
                <div className="od-field">
                  <label className="od-label">Item Name *</label>
                  <input
                    className="od-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="od-field">
                  <label className="od-label">Image URL</label>
                  <input
                    className="od-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={editForm.image}
                    onChange={(e) => setEditForm((p) => ({ ...p, image: e.target.value }))}
                  />
                </div>
              </div>

              <div className="od-field">
                <label className="od-label">Description</label>
                <textarea
                  className="od-textarea"
                  style={{ minHeight: 50 }}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="od-grid4" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                <div className="od-field">
                  <label className="od-label">Price (₹) *</label>
                  <input
                    className="od-input"
                    type="number"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="od-field">
                  <label className="od-label">Offer (%)</label>
                  <input
                    className="od-input"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.offer}
                    onChange={(e) => setEditForm((p) => ({ ...p, offer: e.target.value }))}
                  />
                </div>
                <div className="od-field">
                  <label className="od-label">Category</label>
                  <select
                    className="od-select"
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="od-field">
                  <label className="od-label">Spicy Level</label>
                  <select
                    className="od-select"
                    value={editForm.spicyLevel}
                    onChange={(e) => setEditForm((p) => ({ ...p, spicyLevel: e.target.value }))}
                  >
                    {SPICY_LEVELS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="od-grid2">
                <div className="od-field">
                  <label className="od-label">Food Type</label>
                  <div className="od-veg-row">
                    <button
                      type="button"
                      className={`od-veg-pill veg${editForm.isVeg ? " sel" : ""}`}
                      onClick={() => setEditForm((p) => ({ ...p, isVeg: true }))}
                    >
                      🟢 Veg
                    </button>
                    <button
                      type="button"
                      className={`od-veg-pill nonveg${!editForm.isVeg ? " sel" : ""}`}
                      onClick={() => setEditForm((p) => ({ ...p, isVeg: false }))}
                    >
                      🔴 Non-Veg
                    </button>
                  </div>
                </div>

                <div className="od-field">
                  <label className="od-label">Availability</label>
                  <div className="od-toggle-wrap" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className={`od-toggle ${editForm.isAvailable ? "on" : "off"}`}
                      onClick={() => setEditForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
                    >
                      <div className="od-toggle-knob" />
                    </button>
                    <span className="od-toggle-lb">
                      {editForm.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </div>
                </div>
              </div>

              {editForm.image && (
                <div style={{ marginTop: 4 }}>
                  <label className="od-label" style={{ marginBottom: 6, display: "block" }}>Preview</label>
                  <img
                    src={editForm.image}
                    alt="Preview"
                    style={{
                      width: 100,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid rgba(160,96,240,.2)",
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              <div className="od-modal-btns">
                <button
                  type="button"
                  className="od-modal-cancel"
                  onClick={() => setEditingFood(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="od-submit"
                  disabled={editSubmitting}
                  style={{ flex: 1 }}
                >
                  {editSubmitting ? (
                    <>
                      <span className="od-spinner" /> Updating...
                    </>
                  ) : (
                    "✓ Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddResModal && (
        <div className="od-overlay">
          <div className="od-modal" style={{ maxWidth: 460 }}>
            <div className="od-modal-hd">
              <div>
                <div className="od-modal-ti">Add New Restaurant 🏠</div>
                <div className="od-modal-sub">Create a new branch under your current tier plan limits.</div>
              </div>
              <button className="od-modal-x" onClick={() => setShowAddResModal(false)}>✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = {
                name: fd.get("name"), address: fd.get("address"), city: fd.get("city"),
                phoneNumber: fd.get("phone"),
                openingTime: "10:00", closingTime: "22:00",
                priceRange: "₹₹",
                venueType: fd.get("venueType"),
              };
              
              const btn = e.currentTarget.querySelector("button[type=submit]") as HTMLButtonElement;
              btn.disabled = true;
              btn.innerHTML = "Creating...";

              try {
                const res = await api.post("/restaurants/my/restaurant", data);
                if (res.data?.success) {
                  showToast("Restaurant Created!", "success");
                  setShowAddResModal(false);
                  fetchMyRestaurants();
                }
              } catch (err: any) {
                showToast(err?.response?.data?.message || "Failed to create", "error");
              } finally {
                btn.disabled = false;
                btn.innerHTML = "✓ Create Restaurant";
              }
            }}>
              <div className="od-modal-bd">
                <div className="od-grid2">
                  <div className="od-field">
                    <label className="od-label">Restaurant Name</label>
                    <input name="name" className="od-input" placeholder="TableTime Branch" required />
                  </div>
                  <div className="od-field" style={{marginTop: "0px"}}>
                    <label className="od-label">Venue Type (Nightlife)</label>
                    <select name="venueType" className="od-select" defaultValue="dining">
                      <option value="dining">Dining</option>
                      <option value="club">Club</option>
                      <option value="pub">Pub</option>
                      <option value="lounge">Lounge</option>
                      <option value="rooftop">Rooftop Bar</option>
                      <option value="live_music">Live Music Venue</option>
                    </select>
                  </div>
                </div>
                <div className="od-field">
                  <label className="od-label">City</label>
                  <input name="city" className="od-input" placeholder="Mumbai" required />
                </div>
                <div className="od-field">
                  <label className="od-label">Address</label>
                  <input name="address" className="od-input" placeholder="123 Main St" required />
                </div>
                <div className="od-field">
                  <label className="od-label">Phone</label>
                  <input name="phone" className="od-input" placeholder="+91..." required />
                </div>
              </div>
              <div className="od-modal-btns">
                <button type="button" className="od-modal-cancel" onClick={() => setShowAddResModal(false)}>Cancel</button>
                <button type="submit" className="od-submit" style={{ flex: 1 }}>✓ Create Restaurant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`od-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}