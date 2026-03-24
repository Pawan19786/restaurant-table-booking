import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

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

interface Booking {
  _id: string;
  user: { _id: string; name: string; email: string; picture?: string };
  date: string;
  timeSlot: string;
  guests: number;
  specialRequest: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  createdAt: string;
}

type Tab = "overview" | "bookings" | "menu";

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

const SPICY_LEVELS = ["Mild", "Medium", "Hot", "Extra Hot"];

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

  const token = localStorage.getItem("token");
  const ownerName = localStorage.getItem("name") || "Owner";
  const ownerPic = localStorage.getItem("picture") || "";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const [tab, setTab] = useState<Tab>("overview");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookFilter, setBookFilter] = useState<
    "all" | "pending" | "confirmed" | "rejected" | "cancelled"
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

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "owner") {
      navigate("/unauthorized", { replace: true });
    }
  }, [token, navigate]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMyRestaurant = useCallback(async () => {
    try {
      const res = await api.get("/restaurants/my/restaurant");
      if (res.data?.success) {
        setRestaurant(res.data.restaurant);
        setFoodItems(res.data.foodItems || []);
      }
    } catch {
      showToast("Failed to load restaurant", "error");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookLoading(true);
    try {
      const res = await api.get("/bookings/owner");
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
  }, []);

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
      await Promise.all([fetchMyRestaurant(), fetchBookings(), fetchPendingCount()]);
      setLoading(false);
    };
    init();
  }, [fetchMyRestaurant, fetchBookings, fetchPendingCount]);

  useEffect(() => {
    if (tab === "bookings") {
      fetchBookings();
      fetchPendingCount();
    }
  }, [tab, fetchBookings, fetchPendingCount]);

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
        fetchMyRestaurant();
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
      fetchMyRestaurant();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update item", "error");
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    status: "confirmed" | "rejected",
    reason?: string
  ) => {
    setActionLoading(bookingId + status);
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, {
        status,
        rejectionReason: reason || "",
      });

      showToast(
        status === "confirmed" ? "Booking confirmed! ✅" : "Booking rejected ✗",
        "success"
      );

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

      setPendingCount((prev) => Math.max(0, prev - 1));
      if (newPendingCount > 0) {
        setNewPendingCount((prev) => Math.max(0, prev - 1));
      }

      if (res.data?.booking) {
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
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => (bookFilter === "all" ? true : b.status === bookFilter)),
    [bookings, bookFilter]
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

    // Estimated revenue logic for now
    const avgSpendPerGuest = 500;
    const totalRevenue = confirmedGuests * avgSpendPerGuest;

    const todayBookings = bookings.filter((b) => isSameDay(new Date(b.date), today));
    const todayReservations = todayBookings.length;
    const todayGuests = todayBookings.reduce((sum, b) => sum + b.guests, 0);

    const todayConfirmed = todayBookings.filter((b) => b.status === "confirmed");
    const todayRevenue =
      todayConfirmed.reduce((sum, b) => sum + b.guests, 0) * avgSpendPerGuest;

    // Temporary business metrics until backend adds real fields
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
      if (b.status === "confirmed") {
        bookingsByDateMap[key].revenue += (b.guests || 0) * avgSpendPerGuest;
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
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings]
  );

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
          position:sticky;
          top:0;
          height:100vh;
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
          background:rgba(10,4,24,.95);
          cursor:pointer;
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
      `}</style>

      <div className="od-root">
        <aside className="od-sb">
          <a className="od-sb-logo" href="/dashboard">
            <div className="od-logo-ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 2v7c0 1.1.9 2 2 2h4v11"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9 2v20M18 2v6a4 4 0 01-4 4v10"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="od-logo-tx">TableTime</span>
            <span className="od-logo-bd">Owner</span>
          </a>

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
                badge: pendingCount,
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
            ] as {
              id: Tab;
              label: string;
              icon: React.ReactNode;
              badge?: number;
            }[]).map((item) => (
              <button
                key={item.id}
                className={`od-ni${tab === item.id ? " active" : ""}`}
                onClick={() => setTab(item.id)}
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
              Logout
            </button>
          </div>
        </aside>

        <main className="od-main">
          <div className="od-tb">
            <span className="od-pt">
              {tab === "overview"
                ? "My Restaurant"
                : tab === "bookings"
                ? "Bookings"
                : "Manage Menu"}
            </span>

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

          <div className="od-content">
            {!restaurant && (
              <div className="od-card">
                <div className="od-no-rest">
                  <div className="od-no-rest-ic">🍽️</div>
                  <div className="od-no-rest-title">No Restaurant Assigned</div>
                  <div className="od-no-rest-sub">
                    Superadmin ne abhi tumhara restaurant assign nahi kiya. Unse
                    contact karo — woh tumhara restaurant create karke tumse link
                    karenge.
                  </div>
                </div>
              </div>
            )}

            {restaurant && tab === "overview" && (
              <>
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

                <div className="od-card">
                  <div className="od-card-hd">
                    <span className="od-card-title">Business Overview</span>
                    <span style={{ fontSize: 11, color: "rgba(180,140,255,.4)" }}>
                      Estimated revenue model: ₹{analytics.avgSpendPerGuest} / guest
                    </span>
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
                        sub: "Estimated confirmed revenue today",
                      },
                      {
                        title: "Total Revenue",
                        value: formatCurrency(analytics.totalRevenue),
                        sub: "Estimated confirmed revenue",
                      },
                      {
                        title: "Occupancy",
                        value: `${analytics.occupancy}%`,
                        sub: `Based on temporary seating capacity ${analytics.seatingCapacity}`,
                      },
                      {
                        title: "Staffing Need",
                        value: analytics.suggestedStaffOnShift,
                        sub: "Suggested staff on shift today",
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
                          Aaj ke reservations ke hisaab se total guest load.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Confirmed Guests</div>
                        <div className="od-insight-value">{analytics.confirmedGuests}</div>
                        <div className="od-insight-sub">
                          Sirf accepted bookings ka guest count.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Per Day Orders</div>
                        <div className="od-insight-value">
                          {analytics.todayReservations}
                        </div>
                        <div className="od-insight-sub">
                          Abhi orders module nahi hai, isliye temporary reservation count dikhaya gaya hai.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">Staffing / Capacity Notes</span>
                    </div>
                    <div className="od-info-stack">
                      <div className="od-insight">
                        <div className="od-insight-top">Suggested Staff On Shift</div>
                        <div className="od-insight-value">
                          {analytics.suggestedStaffOnShift}
                        </div>
                        <div className="od-insight-sub">
                          Reservation volume ke hisaab se temporary staffing suggestion.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Occupancy Rate</div>
                        <div className="od-insight-value">{analytics.occupancy}%</div>
                        <div className="od-insight-sub">
                          Temporary capacity model use ho raha hai. Later backend se real seating capacity add karenge.
                        </div>
                      </div>

                      <div className="od-insight">
                        <div className="od-insight-top">Average Spend / Guest</div>
                        <div className="od-insight-value">
                          {formatCurrency(analytics.avgSpendPerGuest)}
                        </div>
                        <div className="od-insight-sub">
                          Ye estimated revenue calculation ke liye use ho raha hai.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {bookings.filter((b) => b.status === "pending").length > 0 && (
                  <div className="od-card">
                    <div className="od-card-hd">
                      <span className="od-card-title">⏳ Pending Bookings</span>
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
                                {formatShortDate(b.date)} · {b.timeSlot} · {b.guests} guests
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

            {restaurant && tab === "bookings" && (
              <div className="od-card">
                <div className="od-card-hd">
                  <span className="od-card-title">All Bookings</span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="od-filter-bar">
                      {(["all", "pending", "confirmed", "rejected", "cancelled"] as const).map(
                        (f) => (
                          <button
                            key={f}
                            className={`od-filter-pill${bookFilter === f ? " active" : ""}`}
                            onClick={() => setBookFilter(f)}
                          >
                            {f === "all"
                              ? "All"
                              : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
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
                        ? "No bookings yet"
                        : `No ${bookFilter} bookings`}
                    </div>
                  ) : (
                    filteredBookings.map((b, i) => {
                      const s = STATUS_STYLE[b.status];
                      const canAct = b.status === "pending";

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
                                val: b.timeSlot,
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
                                val: `${b.guests} guest${b.guests !== 1 ? "s" : ""}`,
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
                                val: `Booked ${formatShortDate(b.createdAt)}`,
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

                          {canAct && (
                            <div className="od-bk-actions">
                              <button
                                className="od-btn od-btn-confirm"
                                disabled={actionLoading === b._id + "confirmed"}
                                onClick={() => handleBookingAction(b._id, "confirmed")}
                              >
                                {actionLoading === b._id + "confirmed" ? (
                                  <>
                                    <span className="od-spinner" /> Confirming...
                                  </>
                                ) : (
                                  "✓ Confirm Booking"
                                )}
                              </button>

                              <button
                                className="od-btn od-btn-reject"
                                disabled={!!actionLoading}
                                onClick={() => setRejectModal({ id: b._id })}
                              >
                                ✗ Reject
                              </button>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
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

      {toast && <div className={`od-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}