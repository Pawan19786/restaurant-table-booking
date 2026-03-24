import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/api";

interface Booking {
  _id: string;
  restaurant: { _id:string; name:string; city:string; image:string; address:string };
  date: string;
  timeSlot: string;
  guests: number;
  specialRequest: string;
  status: "pending"|"confirmed"|"rejected"|"cancelled";
  rejectionReason: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { bg:string; border:string; color:string; label:string; icon:string }> = {
  pending:   { bg:"rgba(251,191,36,0.1)",  border:"rgba(251,191,36,0.3)",  color:"#fbbf24", label:"Pending",   icon:"⏳" },
  confirmed: { bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.3)",  color:"#10b981", label:"Confirmed", icon:"✅" },
  rejected:  { bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.3)",   color:"#f87171", label:"Rejected",  icon:"❌" },
  cancelled: { bg:"rgba(148,163,184,0.1)", border:"rgba(148,163,184,0.25)",color:"#94a3b8", label:"Cancelled", icon:"🚫" },
};

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<"all"|"pending"|"confirmed"|"rejected"|"cancelled">("all");
  const [cancelling, setCancelling] = useState<string|null>(null);

  const fetchBookings = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    api.get("/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBookings(res.data.bookings || []))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    const token = localStorage.getItem("token");
    try {
      await api.patch(`/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    rejected:  bookings.filter(b => b.status === "rejected").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080a0e}
        @keyframes mb-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes mb-spin{to{transform:rotate(360deg)}}
        @keyframes mb-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}

        .mb-root{min-height:100vh;background:#080a0e;font-family:'DM Sans',sans-serif;color:#f0ece4}

        .mb-header{padding:40px 40px 0;animation:mb-fadeUp 0.5s ease both}
        .mb-back{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:9px 16px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(240,236,228,0.6);transition:all 0.2s;margin-bottom:24px}
        .mb-back:hover{border-color:rgba(251,191,36,0.3);color:#fbbf24}
        .mb-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#f0ece4;margin-bottom:6px}
        .mb-sub{font-size:13px;color:rgba(240,236,228,0.4);margin-bottom:28px}

        .mb-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
        .mb-filter{padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:500;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(240,236,228,0.45);transition:all 0.2s}
        .mb-filter:hover{border-color:rgba(251,191,36,0.3);color:rgba(240,236,228,0.8)}
        .mb-filter.active{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.35);color:#fbbf24}
        .mb-count{font-size:10px;background:rgba(255,255,255,0.08);border-radius:10px;padding:1px 6px;margin-left:4px}

        .mb-list{padding:0 40px 40px;display:flex;flex-direction:column;gap:16px}

        .mb-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:18px;overflow:hidden;animation:mb-fadeUp 0.4s ease both;transition:border-color 0.2s}
        .mb-card:hover{border-color:rgba(255,255,255,0.12)}

        .mb-card-top{display:flex;gap:16px;padding:18px 20px}
        .mb-rest-img{width:72px;height:72px;border-radius:12px;object-fit:cover;flex-shrink:0}
        .mb-rest-img-ph{width:72px;height:72px;border-radius:12px;background:linear-gradient(135deg,#111827,#1f2937);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0}
        .mb-card-info{flex:1;min-width:0}
        .mb-rest-name{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:#f0ece4;margin-bottom:4px;cursor:pointer}
        .mb-rest-name:hover{color:#fbbf24}
        .mb-rest-city{font-size:12px;color:rgba(240,236,228,0.4);margin-bottom:8px;display:flex;align-items:center;gap:4px}
        .mb-booking-details{display:flex;flex-wrap:wrap;gap:12px}
        .mb-detail{display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(240,236,228,0.55)}
        .mb-detail svg{color:rgba(251,191,36,0.5)}
        .mb-status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;flex-shrink:0;align-self:flex-start}

        .mb-card-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid rgba(255,255,255,0.05);flex-wrap:wrap;gap:8px}
        .mb-created{font-size:11px;color:rgba(240,236,228,0.25)}
        .mb-actions{display:flex;gap:8px}
        .mb-btn{padding:7px 16px;border-radius:9px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;transition:all 0.2s}
        .mb-btn-view{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(240,236,228,0.6)}
        .mb-btn-view:hover{border-color:rgba(251,191,36,0.3);color:#fbbf24}
        .mb-btn-cancel{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#f87171}
        .mb-btn-cancel:hover{background:rgba(239,68,68,0.15)}
        .mb-btn-cancel:disabled{opacity:0.5;cursor:wait}

        .mb-rejection{padding:10px 20px;background:rgba(239,68,68,0.06);border-top:1px solid rgba(239,68,68,0.1);font-size:12px;color:rgba(248,113,113,0.7);display:flex;align-items:center;gap:6px}

        .mb-special{padding:10px 20px;background:rgba(251,191,36,0.04);border-top:1px solid rgba(251,191,36,0.08);font-size:12px;color:rgba(240,236,228,0.35);display:flex;align-items:flex-start;gap:6px}

        .mb-empty{text-align:center;padding:80px 20px;animation:mb-fadeUp 0.5s ease both}
        .mb-empty-icon{font-size:56px;margin-bottom:16px}
        .mb-empty-title{font-family:'Playfair Display',serif;font-size:22px;color:rgba(240,236,228,0.5);margin-bottom:8px}
        .mb-empty-sub{font-size:13px;color:rgba(240,236,228,0.3);margin-bottom:24px}
        .mb-empty-btn{padding:12px 28px;background:linear-gradient(135deg,#d97706,#fbbf24);border:none;border-radius:12px;color:#080a0e;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s}
        .mb-empty-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(251,191,36,0.3)}

        .mb-skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%);background-size:200% auto;animation:mb-shimmer 1.5s linear infinite;border-radius:8px}
        .mb-spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(240,68,68,0.2);border-top-color:#f87171;animation:mb-spin 0.7s linear infinite;display:inline-block}
      `}</style>

      <div className="mb-root">
        <div className="mb-header">
          <button className="mb-back" onClick={() => navigate("/dashboard")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Dashboard
          </button>
          <h1 className="mb-title">My Bookings</h1>
          <p className="mb-sub">{bookings.length} total reservation{bookings.length !== 1 ? "s" : ""}</p>

          {/* Filters */}
          <div className="mb-filters">
            {(["all","pending","confirmed","rejected","cancelled"] as const).map(f => (
              <button key={f} className={`mb-filter${filter===f?" active":""}`} onClick={() => setFilter(f)}>
                {STATUS_STYLE[f]?.icon || "📋"} {f.charAt(0).toUpperCase()+f.slice(1)}
                <span className="mb-count">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-list">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} style={{borderRadius:18,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{padding:18,display:"flex",gap:16}}>
                  <div className="mb-skeleton" style={{width:72,height:72,borderRadius:12,flexShrink:0}}/>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                    <div className="mb-skeleton" style={{height:18,width:"50%"}}/>
                    <div className="mb-skeleton" style={{height:13,width:"30%"}}/>
                    <div className="mb-skeleton" style={{height:13,width:"70%"}}/>
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="mb-empty">
              <div className="mb-empty-icon">📅</div>
              <div className="mb-empty-title">
                {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
              </div>
              <div className="mb-empty-sub">
                {filter === "all" ? "Explore restaurants and book your first table!" : `You have no ${filter} bookings`}
              </div>
              {filter === "all" && (
                <button className="mb-empty-btn" onClick={() => navigate("/restaurants")}>
                  Browse Restaurants
                </button>
              )}
            </div>
          ) : (
            filtered.map((b, i) => {
              const s = STATUS_STYLE[b.status];
              const canCancel = b.status === "pending" || b.status === "confirmed";
              return (
                <div key={b._id} className="mb-card" style={{animationDelay:`${i*0.06}s`}}>
                  <div className="mb-card-top">
                    {b.restaurant?.image
                      ? <img src={b.restaurant.image} alt={b.restaurant.name} className="mb-rest-img"/>
                      : <div className="mb-rest-img-ph">🍽️</div>
                    }
                    <div className="mb-card-info">
                      <div className="mb-rest-name" onClick={() => navigate(`/restaurants/${b.restaurant?._id}`)}>
                        {b.restaurant?.name || "Restaurant"}
                      </div>
                      <div className="mb-rest-city">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {b.restaurant?.city}
                      </div>
                      <div className="mb-booking-details">
                        <div className="mb-detail">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          {new Date(b.date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                        </div>
                        <div className="mb-detail">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                          {b.timeSlot}
                        </div>
                        <div className="mb-detail">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                          {b.guests} guest{b.guests !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="mb-status-badge" style={{background:s.bg,border:`1px solid ${s.border}`,color:s.color}}>
                      {s.icon} {s.label}
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {b.status === "rejected" && b.rejectionReason && (
                    <div className="mb-rejection">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Reason: {b.rejectionReason}
                    </div>
                  )}

                  {/* Special request */}
                  {b.specialRequest && (
                    <div className="mb-special">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {b.specialRequest}
                    </div>
                  )}

                  <div className="mb-card-footer">
                    <div className="mb-created">
                      Booked {new Date(b.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                    </div>
                    <div className="mb-actions">
                      <button className="mb-btn mb-btn-view" onClick={() => navigate(`/restaurants/${b.restaurant?._id}`)}>
                        View Restaurant
                      </button>
                      {canCancel && (
                        <button className="mb-btn mb-btn-cancel"
                          disabled={cancelling === b._id}
                          onClick={() => handleCancel(b._id)}>
                          {cancelling === b._id ? <span className="mb-spinner"/> : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}