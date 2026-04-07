import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import { useTheme } from "../context/ThemeContext";

interface Event {
  _id?: string;
  eventName: string;
  date: string;
  time: string;
  artist: string;
  entryFee: string;
}

interface Offer {
  _id?: string;
  title: string;
  description: string;
  validTime: string;
}

interface OwnerNightlifeManagerProps {
  restaurant: any;
  onUpdate: () => void;
}

export default function OwnerNightlifeManager({ restaurant, onUpdate }: OwnerNightlifeManagerProps) {
  const { isDark } = useTheme();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [venueType, setVenueType] = useState("dining");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setVenueType(restaurant.venueType || "dining");
      // Format dates nicely for inputs
      setEvents((restaurant.events || []).map((e: any) => ({
        ...e,
        date: e.date ? new Date(e.date).toISOString().split('T')[0] : ""
      })));
      setOffers(restaurant.offers || []);
    }
  }, [restaurant]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/restaurants/${restaurant._id}`, {
        venueType,
        events,
        offers
      });
      if (res.data.success) {
        toast.success("Nightlife details updated!");
        onUpdate();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = () => setEvents([...events, { eventName: "", date: "", time: "", artist: "", entryFee: "" }]);
  const updateEvent = (index: number, field: string, val: string) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: val };
    setEvents(newEvents);
  };
  const removeEvent = (index: number) => setEvents(events.filter((_, i) => i !== index));

  const addOffer = () => setOffers([...offers, { title: "", description: "", validTime: "" }]);
  const updateOffer = (index: number, field: string, val: string) => {
    const newOffers = [...offers];
    newOffers[index] = { ...newOffers[index], [field]: val };
    setOffers(newOffers);
  };
  const removeOffer = (index: number) => setOffers(offers.filter((_, i) => i !== index));

  return (
    <div className={`od-card ${!isDark ? "light" : ""}`} style={{ background: isDark ? "rgba(10,5,30,0.6)" : "#ffffff" }}>
      <div className="od-card-hd">
        <span className="od-card-title">🪩 Manage Nightlife & Events</span>
        <button className="od-btn od-btn-confirm" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "✓ Save Changes"}
        </button>
      </div>
      
      <div style={{ padding: "20px" }}>
        {/* Venue Type */}
        <div className="od-field" style={{ marginBottom: "30px", maxWidth: "300px" }}>
          <label className="od-label">Venue Type</label>
          <select 
            className="od-select" 
            value={venueType} 
            onChange={(e) => setVenueType(e.target.value)}
          >
            <option value="dining">Standard Dining</option>
            <option value="club">Club</option>
            <option value="pub">Pub</option>
            <option value="lounge">Lounge</option>
            <option value="rooftop">Rooftop Bar</option>
            <option value="live_music">Live Music Venue</option>
          </select>
        </div>

        {venueType !== "dining" && (
          <>
            {/* Events Section */}
            <div style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", color: isDark ? "#fff" : "#333", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#ddd"}`, paddingBottom: "8px", width: "100%" }}>
                  🎶 Upcoming Events
                  <button type="button" onClick={addEvent} style={{ float: "right", padding: "4px 12px", background: "var(--violet)", color: "#fff", borderRadius: "16px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                    + Add Event
                  </button>
                </h3>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {events.length === 0 && <p style={{ fontSize: "13px", color: "gray" }}>No events added yet.</p>}
                {events.map((ev, i) => (
                  <div key={i} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9f9f9", padding: "16px", borderRadius: "12px", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#eee"}`, position: "relative" }}>
                    <button onClick={() => removeEvent(i)} style={{ position: "absolute", top: "12px", right: "12px", background: "transparent", border: "none", color: "#f07070", cursor: "pointer", fontSize: "16px" }}>✕</button>
                    
                    <div className="od-grid2">
                      <div className="od-field">
                        <label className="od-label">Event Name *</label>
                        <input className="od-input" value={ev.eventName} onChange={(e) => updateEvent(i, "eventName", e.target.value)} placeholder="e.g. Techno Neon Night" />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Artist / DJ</label>
                        <input className="od-input" value={ev.artist} onChange={(e) => updateEvent(i, "artist", e.target.value)} placeholder="e.g. DJ Snake" />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Date *</label>
                        <input className="od-input" type="date" value={ev.date} onChange={(e) => updateEvent(i, "date", e.target.value)} />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Time *</label>
                        <input className="od-input" type="time" value={ev.time} onChange={(e) => updateEvent(i, "time", e.target.value)} />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Entry Fee / Cover</label>
                        <input className="od-input" value={ev.entryFee} onChange={(e) => updateEvent(i, "entryFee", e.target.value)} placeholder="e.g. ₹1500 or Free" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offers Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", color: isDark ? "#fff" : "#333", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#ddd"}`, paddingBottom: "8px", width: "100%" }}>
                  🎁 Special Offers
                  <button type="button" onClick={addOffer} style={{ float: "right", padding: "4px 12px", background: "var(--teal)", color: "#fff", borderRadius: "16px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                    + Add Offer
                  </button>
                </h3>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {offers.length === 0 && <p style={{ fontSize: "13px", color: "gray" }}>No offers added yet.</p>}
                {offers.map((off, i) => (
                  <div key={i} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9f9f9", padding: "16px", borderRadius: "12px", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#eee"}`, position: "relative" }}>
                    <button onClick={() => removeOffer(i)} style={{ position: "absolute", top: "12px", right: "12px", background: "transparent", border: "none", color: "#f07070", cursor: "pointer", fontSize: "16px" }}>✕</button>
                    
                    <div className="od-grid2">
                      <div className="od-field">
                        <label className="od-label">Offer Title *</label>
                        <input className="od-input" value={off.title} onChange={(e) => updateOffer(i, "title", e.target.value)} placeholder="e.g. Happy Hours 1+1" />
                      </div>
                      <div className="od-field">
                        <label className="od-label">Valid Time</label>
                        <input className="od-input" value={off.validTime} onChange={(e) => updateOffer(i, "validTime", e.target.value)} placeholder="e.g. 6 PM to 9 PM" />
                      </div>
                    </div>
                    <div className="od-field" style={{ marginTop: "12px" }}>
                      <label className="od-label">Description</label>
                      <input className="od-input" value={off.description} onChange={(e) => updateOffer(i, "description", e.target.value)} placeholder="e.g. Buy 1 get 1 free on all domestic beers." />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
