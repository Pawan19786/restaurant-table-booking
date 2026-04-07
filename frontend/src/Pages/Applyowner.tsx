import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";

// ── Country Data ─────────────────────────────────────────────
const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳", states: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Telangana", "Kerala"] },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸", states: ["California", "New York", "Texas", "Florida", "Illinois", "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan"] },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", states: ["England", "Scotland", "Wales", "Northern Ireland"] },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪", states: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"] },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬", states: ["Central", "East", "North", "North-East", "West"] },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", states: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania"] },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", states: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan"] },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪", states: ["Bavaria", "Berlin", "Hamburg", "Hesse", "Saxony", "Baden-Württemberg"] },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", states: ["Île-de-France", "Provence", "Normandy", "Brittany", "Occitanie"] },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵", states: ["Tokyo", "Osaka", "Kyoto", "Hokkaido", "Aichi", "Fukuoka"] },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳", states: ["Beijing", "Shanghai", "Guangdong", "Sichuan", "Zhejiang"] },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷", states: ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Paraná"] },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦", states: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo"] },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿", states: ["Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty"] },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰", states: ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad"] },
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur", "Kolhapur"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Connaught Place"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
  "New York": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
  "Dubai": ["Dubai Marina", "Downtown Dubai", "Deira", "Bur Dubai", "JBR"],
  "default": ["City 1", "City 2", "City 3"],
};

const CUISINES = ["Indian","Italian","Chinese","Mexican","Japanese","Thai","Continental","Middle Eastern","American","Mediterranean","Korean","French"];

const PLANS = [
  {
    id: "silver", name: "Silver", icon: "🥈",
    color: "#94a3b8", glow: "rgba(148,163,184,0.4)",
    gradient: "linear-gradient(135deg, #334155, #1e293b)",
    border: "rgba(148,163,184,0.4)",
    features: ["1 Restaurant", "Basic Dashboard", "Menu Management", "Email Support"],
    prices: { monthly:999, quarterly:2699, "6month":4999, yearly:8999, "2year":16999, "3year":23999, "4year":29999 }
  },
  {
    id: "gold", name: "Gold", icon: "🥇",
    color: "#f59e0b", glow: "rgba(245,158,11,0.5)",
    gradient: "linear-gradient(135deg, #78350f, #451a03)",
    border: "rgba(245,158,11,0.5)",
    features: ["3 Restaurants", "Analytics Dashboard", "Priority Support", "Food Item Management", "Booking Management"],
    prices: { monthly:1999, quarterly:5399, "6month":9999, yearly:17999, "2year":33999, "3year":47999, "4year":59999 }
  },
  {
    id: "platinum", name: "Platinum", icon: "💎",
    color: "#818cf8", glow: "rgba(129,140,248,0.6)",
    gradient: "linear-gradient(135deg, #312e81, #1e1b4b)",
    border: "rgba(129,140,248,0.6)",
    features: ["Unlimited Restaurants", "Full Analytics", "Dedicated Support", "Custom Branding", "API Access", "Priority Listing"],
    prices: { monthly:4999, quarterly:13499, "6month":24999, yearly:44999, "2year":84999, "3year":119999, "4year":149999 }
  },
];

const DURATIONS = [
  { id: "monthly",   label: "Monthly",   months: 1,  discount: 0 },
  { id: "quarterly", label: "Quarterly", months: 3,  discount: 10 },
  { id: "6month",    label: "6 Months",  months: 6,  discount: 17 },
  { id: "yearly",    label: "1 Year",    months: 12, discount: 25 },
  { id: "2year",     label: "2 Years",   months: 24, discount: 29 },
  { id: "3year",     label: "3 Years",   months: 36, discount: 33 },
  { id: "4year",     label: "4 Years",   months: 48, discount: 37 },
];

// ── Cloudinary direct upload helper ─────────────────────────
// Uses Cloudinary's unsigned upload — set VITE_CLOUDINARY_CLOUD_NAME
// and VITE_CLOUDINARY_UPLOAD_PRESET in your .env
const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary env vars missing: VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "tabletime/owner-applications");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string; // ← this is the URL we store in MongoDB
};

export default function ApplyOwner() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  // ── Upload state (track in-progress uploads separately) ──
  const [uploadingPhoto, setUploadingPhoto]   = useState(false);
  const [uploadingIdProof, setUploadingIdProof] = useState(false);

  // Form state
  const userName  = localStorage.getItem("name")  || "";
  const userEmail = localStorage.getItem("email") || "";

  const [form, setForm] = useState({
    // Step 1
    fullName: userName, email: userEmail, phone: "",
    country: COUNTRIES[0], state: "", city: "",
    // Step 2
    restaurantName: "", address: "", restaurantType: "",
    cuisines: [] as string[],
    restaurantPhoto: "",        // ← Cloudinary URL (NOT base64)
    restaurantPhotoPreview: "", // ← local preview only (base64 for <img>)
    // Step 3 — Operations
    description: "", restaurantPhone: "", managerContact: "", telNumber: "",
    openingTime: "", closingTime: "", priceRange: "mid", rating: "",
    // Step 4 — Documents
    fssaiNumber: "", idProofType: "aadhar",
    idProof: "",        // ← Cloudinary URL
    idProofPreview: "", // ← local preview only
    // Step 5 — Plan
    plan: "", duration: "",
    // Step 6 — Payment
    cardName: "", cardNumber: "", cardExpiry: "", cardCvv: "",
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  // ── Galaxy canvas animation ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x:number; y:number; r:number; speed:number; opacity:number; hue:number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.8+0.3, speed: Math.random()*0.4+0.1, opacity: Math.random(), hue: Math.random()*60+220 });
    }
    const particles: { x:number; y:number; vx:number; vy:number; r:number; opacity:number; hue:number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, r: Math.random()*2+1, opacity: Math.random()*0.6+0.2, hue: [280,220,190,45][Math.floor(Math.random()*4)] });
    }
    let animId: number;
    let t = 0;
    const draw = () => {
      t += 0.005;
      ctx.fillStyle = "rgba(4,2,15,0.15)";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      [{ x:canvas.width*0.2, y:canvas.height*0.3, r:300, h:280 },{ x:canvas.width*0.8, y:canvas.height*0.7, r:250, h:200 },{ x:canvas.width*0.5, y:canvas.height*0.1, r:200, h:320 }].forEach((n,i)=>{
        const g=ctx.createRadialGradient(n.x+Math.sin(t+i)*30,n.y+Math.cos(t+i)*20,0,n.x,n.y,n.r);
        g.addColorStop(0,`hsla(${n.h},80%,30%,0.04)`); g.addColorStop(1,"transparent");
        ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
      });
      stars.forEach(s=>{
        s.y+=s.speed; s.opacity+=(Math.random()-0.5)*0.05; s.opacity=Math.max(0.1,Math.min(1,s.opacity));
        if(s.y>canvas.height){s.y=0;s.x=Math.random()*canvas.width;}
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${s.hue},80%,90%,${s.opacity})`; ctx.fill();
      });
      particles.forEach((p,i)=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width)p.vx*=-1;
        if(p.y<0||p.y>canvas.height)p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},90%,70%,${p.opacity})`; ctx.fill();
        particles.slice(i+1).forEach(p2=>{
          const dx=p.x-p2.x,dy=p.y-p2.y,dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<120){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p2.x,p2.y);ctx.strokeStyle=`hsla(${p.hue},80%,70%,${0.15*(1-dist/120)})`;ctx.lineWidth=0.5;ctx.stroke();}
        });
      });
      animId = requestAnimationFrame(draw);
    };
    ctx.fillStyle="#04020f"; ctx.fillRect(0,0,canvas.width,canvas.height);
    draw();
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    window.addEventListener("resize",resize);
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener("resize",resize);};
  }, []);

  const selectedPlan  = PLANS.find(p => p.id === form.plan);
  const selectedDur   = DURATIONS.find(d => d.id === form.duration);
  const selectedPrice = selectedPlan && selectedDur ? selectedPlan.prices[form.duration as keyof typeof selectedPlan.prices] : 0;
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch));

  // ── THE FIX: upload to Cloudinary, store URL ──────────────
  const handleFileUpload = async (
    file: File,
    urlField: string,          // form key that stores Cloudinary URL
    previewField: string,      // form key that stores local base64 preview
    setUploading: (v: boolean) => void
  ) => {
    // 1. Show local preview immediately (good UX)
    const reader = new FileReader();
    reader.onload = (e) => set(previewField, e.target?.result as string);
    reader.readAsDataURL(file);

    // 2. Upload to Cloudinary and store the returned URL
    setUploading(true);
    try {
      const cloudUrl = await uploadToCloudinary(file);
      set(urlField, cloudUrl); // ← this is what goes to MongoDB
      toast.success("Photo uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.message || "Try again"));
      set(urlField, "");       // clear so validation catches it
      set(previewField, "");
    } finally {
      setUploading(false);
    }
  };

  // ── Step validations ─────────────────────────────────────
  const validateStep1 = () => {
    if (!form.fullName.trim())        { toast.error("Full name is required"); return false; }
    if (!form.phone.trim())           { toast.error("Phone number is required"); return false; }
    if (form.phone.trim().length < 7) { toast.error("Enter a valid phone number"); return false; }
    if (!form.state)                  { toast.error("Please select your state"); return false; }
    if (!form.city)                   { toast.error("Please select your city"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.restaurantName.trim())  { toast.error("Restaurant name is required"); return false; }
    if (!form.restaurantType)         { toast.error("Please select restaurant type"); return false; }
    if (!form.address.trim())         { toast.error("Restaurant address is required"); return false; }
    if (form.cuisines.length === 0)   { toast.error("Please select at least one cuisine type"); return false; }
    if (!form.restaurantPhoto)        { toast.error("Please wait for photo upload to complete"); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!form.restaurantPhone.trim()) { toast.error("Restaurant phone number is required"); return false; }
    if (!form.openingTime)            { toast.error("Opening time is required"); return false; }
    if (!form.closingTime)            { toast.error("Closing time is required"); return false; }
    if (form.rating && (parseFloat(form.rating) < 0 || parseFloat(form.rating) > 5)) {
      toast.error("Rating must be between 0 and 5"); return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!form.fssaiNumber || form.fssaiNumber.length !== 14) {
      toast.error("FSSAI number must be exactly 14 digits"); return false;
    }
    if (!form.idProof) { toast.error("Please wait for ID proof upload to complete"); return false; }
    return true;
  };

  const validateStep5 = () => {
    if (!form.plan)     { toast.error("Please select a subscription plan"); return false; }
    if (!form.duration) { toast.error("Please select a duration"); return false; }
    return true;
  };

  const validateStep6 = () => {
    if (!form.cardName.trim())         { toast.error("Cardholder name is required"); return false; }
    if (form.cardNumber.length !== 16) { toast.error("Card number must be 16 digits"); return false; }
    if (form.cardExpiry.length !== 5)  { toast.error("Enter valid expiry date (MM/YY)"); return false; }
    if (form.cardCvv.length !== 3)     { toast.error("CVV must be 3 digits"); return false; }
    return true;
  };

  const goNext = (nextStep: number) => {
    if (nextStep === 2 && !validateStep1()) return;
    if (nextStep === 3 && !validateStep2()) return;
    if (nextStep === 4 && !validateStep3()) return;
    if (nextStep === 5 && !validateStep4()) return;
    if (nextStep === 6 && !validateStep5()) return;
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Final submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep6()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/user/apply-owner", {
        fullName:             form.fullName,
        phone:                form.country.dial + form.phone,
        country:              form.country.name,
        state:                form.state,
        city:                 form.city,
        restaurantName:       form.restaurantName,
        restaurantType:       form.restaurantType,
        address:              form.address,
        cuisines:             form.cuisines,
        restaurantPhoto:      form.restaurantPhoto,   // ← Cloudinary URL ✅
        // Step 3 — Operations
        description:          form.description,
        restaurantPhone:      form.restaurantPhone,
        managerContact:       form.managerContact,
        telNumber:            form.telNumber,
        openingTime:          form.openingTime,
        closingTime:          form.closingTime,
        priceRange:           form.priceRange,
        rating:               form.rating,
        // Step 4 — Documents
        fssaiNumber:          form.fssaiNumber,
        idProofType:          form.idProofType,
        idProof:              form.idProof,           // ← Cloudinary URL ✅
        subscriptionPlan:     form.plan,
        subscriptionDuration: form.duration,
        subscriptionPrice:    selectedPrice,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ["Personal Info", "Restaurant Info", "Operations", "Documents", "Choose Plan", "Payment"];
  const stepIcons  = ["👤", "🏪", "⚙️", "📄", "💎", "💳"];

  if (success) return (
    <div style={{ position:"fixed", inset:0, background:"#04020f", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:24, fontFamily:"'Cinzel', serif" }}>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, zIndex:0 }}/>
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ fontSize:80, marginBottom:16, animation:"bounce 1s ease infinite" }}>🎉</div>
        <div style={{ fontSize:32, fontWeight:700, color:"#f0e6ff", marginBottom:8, letterSpacing:"0.06em" }}>Application Submitted!</div>
        <div style={{ fontSize:14, color:"rgba(200,170,255,0.6)", marginBottom:32, fontFamily:"'Montserrat',sans-serif", lineHeight:1.8 }}>
          Your owner application has been sent to the SuperAdmin.<br/>
          You will be notified once it is reviewed.
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(160,96,240,0.3)", borderRadius:16, padding:"20px 32px", marginBottom:32, display:"inline-block" }}>
          <div style={{ fontSize:11, color:"rgba(180,140,255,0.5)", letterSpacing:"0.1em", marginBottom:8, fontFamily:"'Montserrat',sans-serif" }}>SELECTED PLAN</div>
          <div style={{ fontSize:20, color:"#f0e6ff" }}>{selectedPlan?.icon} {selectedPlan?.name} — {selectedDur?.label}</div>
          <div style={{ fontSize:24, color:"#a060f0", fontWeight:700, marginTop:4 }}>₹{selectedPrice?.toLocaleString()}</div>
        </div>
        <br/>
        <button onClick={()=>navigate("/dashboard")} style={{ background:"linear-gradient(135deg,#7030d0,#a060f0)", border:"none", borderRadius:12, padding:"14px 36px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Montserrat',sans-serif", letterSpacing:"0.06em" }}>
          Back to Dashboard
        </button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes ao-fadeUp   {from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ao-slideIn  {from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ao-glow     {0%,100%{box-shadow:0 0 20px rgba(160,96,240,0.3)}50%{box-shadow:0 0 40px rgba(160,96,240,0.7)}}
        @keyframes ao-spin     {to{transform:rotate(360deg)}}
        @keyframes ao-pulse    {0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.97)}}
        @keyframes ao-float    {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ao-shimmer  {0%{background-position:-200% center}100%{background-position:200% center}}

        .ao-root { min-height:100vh;position:relative;overflow:hidden;font-family:'Montserrat',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px; }
        .ao-canvas { position:fixed;inset:0;z-index:0; }
        .ao-wrap { position:relative;z-index:1;width:100%;max-width:680px;animation:ao-fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .ao-header { text-align:center;margin-bottom:32px; }
        .ao-title { font-family:'Cinzel',serif;font-size:clamp(22px,4vw,34px);font-weight:700;background:linear-gradient(135deg,#f0e6ff,#c084fc,#818cf8,#f0e6ff);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:ao-shimmer 4s linear infinite;letter-spacing:0.08em;margin-bottom:8px; }
        .ao-sub { font-size:13px;color:rgba(200,170,255,0.55);letter-spacing:0.1em;text-transform:uppercase; }
        .ao-steps { display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:36px;position:relative; }
        .ao-step-item { display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;flex:1; }
        .ao-step-circle { width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;position:relative;z-index:2;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);border:2px solid rgba(160,96,240,0.2);background:rgba(10,4,24,0.8);cursor:default; }
        .ao-step-circle.done { background:linear-gradient(135deg,#7030d0,#a060f0);border-color:transparent;box-shadow:0 0 20px rgba(160,96,240,0.5);transform:scale(1.1); }
        .ao-step-circle.active { border-color:rgba(160,96,240,0.8);box-shadow:0 0 30px rgba(160,96,240,0.4);animation:ao-glow 2s ease infinite;background:rgba(112,48,208,0.2);transform:scale(1.15); }
        .ao-step-line { position:absolute;top:22px;left:50%;right:-50%;height:2px;background:rgba(160,96,240,0.15);z-index:1;transition:background 0.5s; }
        .ao-step-line.done { background:linear-gradient(90deg,#7030d0,#a060f0); }
        .ao-step-label { font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(180,140,255,0.4);white-space:nowrap; }
        .ao-step-label.active { color:rgba(200,160,255,0.9); }
        .ao-step-label.done   { color:rgba(160,96,240,0.7); }
        .ao-card { background:rgba(8,4,22,0.7);border:1px solid rgba(160,96,240,0.2);border-radius:24px;padding:36px;backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);box-shadow:0 40px 120px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.05);animation:ao-slideIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .ao-step-title { font-family:'Cinzel',serif;font-size:20px;font-weight:600;color:rgba(230,210,255,0.9);margin-bottom:6px;letter-spacing:0.04em; }
        .ao-step-desc { font-size:12px;color:rgba(180,140,255,0.45);margin-bottom:28px; }
        .ao-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
        .ao-grid3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px; }
        .ao-field { display:flex;flex-direction:column;gap:7px;margin-bottom:4px; }
        .ao-label { font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(180,140,255,0.5); }
        .ao-input { background:rgba(255,255,255,0.04);border:1px solid rgba(160,96,240,0.18);border-radius:10px;padding:12px 14px;font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(220,200,255,0.9);outline:none;transition:all 0.25s;width:100%; }
        .ao-input:focus { border-color:rgba(160,96,240,0.6);background:rgba(160,96,240,0.08);box-shadow:0 0 0 3px rgba(160,96,240,0.12); }
        .ao-input::placeholder { color:rgba(180,140,255,0.22); }
        .ao-select { background:rgba(8,4,22,0.95);border:1px solid rgba(160,96,240,0.18);border-radius:10px;padding:12px 14px;font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(220,200,255,0.9);outline:none;cursor:pointer;width:100%;transition:all 0.25s; }
        .ao-select:focus { border-color:rgba(160,96,240,0.6);box-shadow:0 0 0 3px rgba(160,96,240,0.12); }
        .ao-phone-wrap { display:flex;gap:8px; }
        .ao-country-btn { display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.04);border:1px solid rgba(160,96,240,0.18);border-radius:10px;padding:12px 14px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(220,200,255,0.9);white-space:nowrap;transition:all 0.25s;min-width:110px; }
        .ao-country-btn:hover { border-color:rgba(160,96,240,0.5);background:rgba(160,96,240,0.08); }
        .ao-country-drop { position:absolute;top:calc(100% + 8px);left:0;z-index:100;background:rgba(8,4,22,0.97);border:1px solid rgba(160,96,240,0.3);border-radius:14px;width:280px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.8);animation:ao-fadeUp 0.2s ease both; }
        .ao-country-search { padding:12px 14px;background:rgba(160,96,240,0.08);border-bottom:1px solid rgba(160,96,240,0.1); }
        .ao-country-search input { width:100%;background:none;border:none;outline:none;font-family:'Montserrat',sans-serif;font-size:12px;color:rgba(220,200,255,0.8); }
        .ao-country-search input::placeholder { color:rgba(180,140,255,0.3); }
        .ao-country-list { max-height:220px;overflow-y:auto; }
        .ao-country-item { display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background 0.15s;font-size:12px;color:rgba(200,170,255,0.8); }
        .ao-country-item:hover { background:rgba(160,96,240,0.12); }
        .ao-country-item.sel { background:rgba(160,96,240,0.2);color:#d0a0ff; }
        .ao-cuisine-grid { display:flex;flex-wrap:wrap;gap:8px; }
        .ao-cuisine-tag { background:rgba(255,255,255,0.04);border:1px solid rgba(160,96,240,0.15);border-radius:20px;padding:6px 14px;font-family:'Montserrat',sans-serif;font-size:11px;color:rgba(180,140,255,0.5);cursor:pointer;transition:all 0.2s; }
        .ao-cuisine-tag.sel { background:rgba(160,96,240,0.2);border-color:rgba(160,96,240,0.5);color:#d0a0ff;box-shadow:0 0 12px rgba(160,96,240,0.2); }
        .ao-upload { position:relative;border:1.5px dashed rgba(160,96,240,0.25);border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;justify-content:center;min-height:110px; }
        .ao-upload:hover { border-color:rgba(160,96,240,0.5);background:rgba(160,96,240,0.05); }
        .ao-upload input[type=file] { position:absolute;inset:0;opacity:0;cursor:pointer;z-index:2; }
        .ao-upload-content { display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;padding:20px; }
        .ao-upload-preview { width:100%;height:110px;object-fit:cover;border-radius:10px; }
        .ao-upload-uploading { display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;padding:20px; }
        .ao-plans { display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px; }
        .ao-plan { border-radius:16px;padding:20px 16px;cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;border:1.5px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03); }
        .ao-plan:hover { transform:translateY(-4px) scale(1.02); }
        .ao-plan.sel { transform:translateY(-6px) scale(1.04); }
        .ao-plan-icon { font-size:28px;margin-bottom:8px;display:block;animation:ao-float 3s ease infinite; }
        .ao-plan-name { font-family:'Cinzel',serif;font-size:14px;font-weight:600;margin-bottom:6px; }
        .ao-plan-feat { font-size:10px;color:rgba(200,180,255,0.5);line-height:1.8; }
        .ao-durations { display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px; }
        .ao-dur { padding:8px 16px;border-radius:20px;cursor:pointer;transition:all 0.25s;font-size:11px;font-weight:600;letter-spacing:0.06em;border:1px solid rgba(160,96,240,0.2);background:rgba(255,255,255,0.03);color:rgba(180,140,255,0.5); }
        .ao-dur:hover { border-color:rgba(160,96,240,0.4);color:rgba(200,170,255,0.8); }
        .ao-dur.sel { background:rgba(160,96,240,0.2);border-color:rgba(160,96,240,0.6);color:#d0a0ff;box-shadow:0 0 16px rgba(160,96,240,0.25); }
        .ao-dur-discount { font-size:8px;background:rgba(40,200,120,0.2);color:#60d090;border:1px solid rgba(40,200,120,0.3);border-radius:10px;padding:1px 5px;margin-left:4px; }
        .ao-price-box { background:linear-gradient(135deg,rgba(112,48,208,0.15),rgba(129,140,248,0.1));border:1px solid rgba(160,96,240,0.25);border-radius:14px;padding:20px 24px;text-align:center;margin-bottom:4px;animation:ao-pulse 3s ease infinite; }
        .ao-card-3d { width:100%;max-width:360px;height:200px;margin:0 auto 28px;perspective:1000px;cursor:pointer; }
        .ao-card-inner { width:100%;height:100%;position:relative;transition:transform 0.6s;transform-style:preserve-3d; }
        .ao-card-inner.flipped { transform:rotateY(180deg); }
        .ao-card-front,.ao-card-back { position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;padding:24px;display:flex;flex-direction:column;justify-content:space-between; }
        .ao-card-front { background:linear-gradient(135deg,#1a0533,#2d1b69,#1e1b4b);border:1px solid rgba(160,96,240,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 40px rgba(160,96,240,0.15); }
        .ao-card-back { background:linear-gradient(135deg,#2d1b69,#1a0533,#2d1b69);border:1px solid rgba(160,96,240,0.3);transform:rotateY(180deg); }
        .ao-btn-primary { width:100%;padding:14px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#7030d0,#a060f0,#7030d0);background-size:200% auto;color:#fff;font-size:14px;font-weight:700;font-family:'Montserrat',sans-serif;letter-spacing:0.08em;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.3s;margin-top:24px;box-shadow:0 8px 32px rgba(112,48,208,0.4);animation:ao-shimmer 3s linear infinite; }
        .ao-btn-primary:hover { background-position:right;box-shadow:0 12px 40px rgba(112,48,208,0.6);transform:translateY(-2px); }
        .ao-btn-primary:disabled { opacity:0.6;cursor:wait;transform:none; }
        .ao-btn-back { background:none;border:1px solid rgba(160,96,240,0.2);border-radius:10px;padding:10px 20px;color:rgba(180,140,255,0.6);font-size:12px;font-family:'Montserrat',sans-serif;cursor:pointer;transition:all 0.2s;margin-top:12px; }
        .ao-btn-back:hover { border-color:rgba(160,96,240,0.4);color:rgba(200,170,255,0.8); }
        .ao-spinner { width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;animation:ao-spin 0.7s linear infinite;display:inline-block; }
        .ao-divider { height:1px;background:rgba(160,96,240,0.1);margin:20px 0; }
        .ao-hint { font-size:10px;color:rgba(160,96,240,0.5);margin-top:4px; }
        .ao-country-list::-webkit-scrollbar { width:4px; }
        .ao-country-list::-webkit-scrollbar-track { background:transparent; }
        .ao-country-list::-webkit-scrollbar-thumb { background:rgba(160,96,240,0.3);border-radius:2px; }

        /* ════════════ LIGHT THEME ════════════ */
        .ao-root.light { background:linear-gradient(135deg,#f8fafc,#e2e8f0); color:#0f172a; }
        .ao-root.light .ao-title { background:linear-gradient(135deg,#3b0764,#6b21a8,#9333ea,#3b0764); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .ao-root.light .ao-sub { color:#6b21a8; }
        .ao-root.light .ao-step-circle { background:#ffffff; border-color:rgba(168,85,247,0.3); color:#6b21a8; }
        .ao-root.light .ao-step-line { background:rgba(168,85,247,0.2); }
        .ao-root.light .ao-step-label { color:#64748b; }
        .ao-root.light .ao-step-label.active { color:#6b21a8; font-weight:600; }
        .ao-root.light .ao-step-label.done { color:#9333ea; }
        
        .ao-root.light .ao-card { background:rgba(255,255,255,0.85); border-color:rgba(168,85,247,0.2); box-shadow:0 24px 60px rgba(0,0,0,0.05); }
        .ao-root.light .ao-step-title { color:#3b0764; }
        .ao-root.light .ao-step-desc { color:#475569; }
        
        .ao-root.light .ao-label { color:#6b21a8; }
        .ao-root.light .ao-input, .ao-root.light .ao-select { background:#ffffff; border-color:rgba(168,85,247,0.2); color:#0f172a; }
        .ao-root.light .ao-input:focus, .ao-root.light .ao-select:focus { border-color:rgba(168,85,247,0.5); background:#faf5ff; box-shadow:0 0 0 3px rgba(168,85,247,0.1); }
        .ao-root.light .ao-input::placeholder { color:#94a3b8; }
        
        .ao-root.light .ao-country-btn { background:#ffffff; border-color:rgba(168,85,247,0.2); color:#0f172a; }
        .ao-root.light .ao-country-btn:hover { border-color:rgba(168,85,247,0.4); background:#faf5ff; }
        .ao-root.light .ao-country-drop { background:#ffffff; border-color:rgba(168,85,247,0.2); box-shadow:0 12px 30px rgba(0,0,0,0.1); }
        .ao-root.light .ao-country-search { background:#faf5ff; border-bottom-color:rgba(168,85,247,0.1); }
        .ao-root.light .ao-country-search input { color:#0f172a; }
        .ao-root.light .ao-country-item { color:#475569; }
        .ao-root.light .ao-country-item:hover { background:#faf5ff; }
        .ao-root.light .ao-country-item.sel { background:#f3e8ff; color:#7e22ce; }
        
        .ao-root.light .ao-cuisine-tag { background:#ffffff; border-color:rgba(168,85,247,0.2); color:#64748b; }
        .ao-root.light .ao-cuisine-tag.sel { background:#f3e8ff; border-color:rgba(168,85,247,0.4); color:#7e22ce; box-shadow:0 0 10px rgba(168,85,247,0.1); }
        
        .ao-root.light .ao-upload { border-color:rgba(168,85,247,0.3); }
        .ao-root.light .ao-upload:hover { border-color:rgba(168,85,247,0.5); background:#faf5ff; }
        .ao-root.light .ao-upload-content span { color:#6b21a8; }
        
        .ao-root.light .ao-plan { background:#ffffff; border-color:rgba(168,85,247,0.2); box-shadow:0 4px 12px rgba(0,0,0,0.02); }
        .ao-root.light .ao-plan-feat { color:#475569; }
        .ao-root.light .ao-dur { background:#ffffff; border-color:rgba(168,85,247,0.2); color:#64748b; }
        .ao-root.light .ao-dur.sel { background:#f3e8ff; border-color:rgba(168,85,247,0.5); color:#7e22ce; box-shadow:0 0 12px rgba(168,85,247,0.1); }
        .ao-root.light .ao-price-box { background:#f3e8ff; border-color:rgba(168,85,247,0.3); }
        .ao-root.light .ao-price-box div { color:#6b21a8 !important; }
        
        .ao-root.light .ao-btn-back { border-color:rgba(168,85,247,0.2); color:#6b21a8; }
        .ao-root.light .ao-btn-back:hover { border-color:rgba(168,85,247,0.4); background:#faf5ff; }
        .ao-root.light .ao-spinner { border-color:rgba(0,0,0,0.1); border-top-color:#7e22ce; }
      `}</style>

      <canvas ref={canvasRef} className="ao-canvas" style={{ opacity: isDark ? 1 : 0, transition: "opacity 0.6s" }} />

      <div className={`ao-root${!isDark ? " light" : ""}`}>
        <div className="ao-wrap">

          {/* Header */}
          <div className="ao-header">
            <div className="ao-title">✦ Become a Restaurant Owner ✦</div>
            <div className="ao-sub">Join the TableTime Partner Network</div>
          </div>

          {/* Step Indicator */}
          <div className="ao-steps">
            {stepTitles.map((title, i) => {
              const n = i + 1;
              const isDone   = step > n;
              const isActive = step === n;
              return (
                <div key={n} className="ao-step-item">
                  {i < stepTitles.length - 1 && (
                    <div className={`ao-step-line${isDone ? " done" : ""}`} />
                  )}
                  <div className={`ao-step-circle${isDone?" done":isActive?" active":""}`}>
                    {isDone ? "✓" : stepIcons[i]}
                  </div>
                  <div className={`ao-step-label${isDone?" done":isActive?" active":""}`}>{title}</div>
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div className="ao-card">

            {/* ── STEP 1 — Personal Info ── */}
            {step === 1 && (
              <>
                <div className="ao-step-title">👤 Personal Information</div>
                <div className="ao-step-desc">Tell us about yourself — we'll use this for your owner profile.</div>

                <div className="ao-grid2" style={{marginBottom:16}}>
                  <div className="ao-field">
                    <label className="ao-label">Full Name</label>
                    <input className="ao-input" value={form.fullName} onChange={e=>set("fullName",e.target.value)} placeholder="Your full name"/>
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Email</label>
                    <input className="ao-input" value={form.email} readOnly style={{opacity:0.6}}/>
                  </div>
                </div>

                <div className="ao-field" style={{marginBottom:16}}>
                  <label className="ao-label">Phone Number</label>
                  <div className="ao-phone-wrap">
                    <div style={{position:"relative"}}>
                      <button type="button" className="ao-country-btn" onClick={()=>setShowCountryDrop(p=>!p)}>
                        <span style={{fontSize:20}}>{form.country.flag}</span>
                        <span style={{fontSize:12,color:"rgba(180,140,255,0.7)"}}>{form.country.dial}</span>
                        <span style={{fontSize:10,opacity:0.5}}>▼</span>
                      </button>
                      {showCountryDrop && (
                        <div className="ao-country-drop">
                          <div className="ao-country-search">
                            <input autoFocus placeholder="🔍 Search country..." value={countrySearch} onChange={e=>setCountrySearch(e.target.value)}/>
                          </div>
                          <div className="ao-country-list">
                            {filteredCountries.map(c => (
                              <div key={c.code} className={`ao-country-item${form.country.code===c.code?" sel":""}`}
                                onClick={()=>{ set("country",c); set("state",""); set("city",""); setShowCountryDrop(false); setCountrySearch(""); }}>
                                <span style={{fontSize:18}}>{c.flag}</span>
                                <span style={{flex:1}}>{c.name}</span>
                                <span style={{opacity:0.5,fontSize:11}}>{c.dial}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input className="ao-input" style={{flex:1}} placeholder="Enter phone number" value={form.phone} onChange={e=>set("phone",e.target.value)} type="tel"/>
                  </div>
                </div>

                <div className="ao-grid3">
                  <div className="ao-field">
                    <label className="ao-label">Country</label>
                    <input className="ao-input" value={form.country.name} readOnly style={{opacity:0.6}}/>
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">State</label>
                    <select className="ao-select" value={form.state} onChange={e=>{ set("state",e.target.value); set("city",""); }}>
                      <option value="">Select State</option>
                      {form.country.states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">City</label>
                    <select className="ao-select" value={form.city} onChange={e=>set("city",e.target.value)}>
                      <option value="">Select City</option>
                      {(CITIES_BY_STATE[form.state] || CITIES_BY_STATE["default"]).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <button className="ao-btn-primary" onClick={()=>goNext(2)}>
                  Continue <span>→</span>
                </button>
              </>
            )}

            {/* ── STEP 2 — Restaurant Info ── */}
            {step === 2 && (
              <>
                <div className="ao-step-title">🏪 Restaurant Details</div>
                <div className="ao-step-desc">Tell us about your restaurant — the more detail, the better.</div>

                <div className="ao-grid2" style={{marginBottom:16}}>
                  <div className="ao-field">
                    <label className="ao-label">Restaurant Name *</label>
                    <input className="ao-input" placeholder="e.g. The Grand Spice" value={form.restaurantName} onChange={e=>set("restaurantName",e.target.value)}/>
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Restaurant Type *</label>
                    <select className="ao-select" value={form.restaurantType} onChange={e=>set("restaurantType",e.target.value)}>
                      <option value="">Select Type</option>
                      <option value="veg">🟢 Pure Veg</option>
                      <option value="nonveg">🔴 Non-Veg</option>
                      <option value="both">🟡 Both</option>
                    </select>
                  </div>
                </div>

                <div className="ao-field" style={{marginBottom:16}}>
                  <label className="ao-label">Full Address *</label>
                  <input className="ao-input" placeholder="Street address, landmark, area..." value={form.address} onChange={e=>set("address",e.target.value)}/>
                </div>

                <div className="ao-field" style={{marginBottom:16}}>
                  <label className="ao-label">Cuisine Types (select all that apply)</label>
                  <div className="ao-cuisine-grid">
                    {CUISINES.map(c => (
                      <button key={c} type="button"
                        className={`ao-cuisine-tag${form.cuisines.includes(c)?" sel":""}`}
                        onClick={()=>set("cuisines", form.cuisines.includes(c) ? form.cuisines.filter((x:string)=>x!==c) : [...form.cuisines,c])}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ao-field" style={{marginBottom:4}}>
                  <label className="ao-label">Restaurant Photo *</label>
                  <div className="ao-upload">
                    {/* ── THE FIX: disable input while uploading ── */}
                    <input type="file" accept="image/*"
                      disabled={uploadingPhoto}
                      onChange={e=>{
                        if(e.target.files?.[0])
                          handleFileUpload(e.target.files[0], "restaurantPhoto", "restaurantPhotoPreview", setUploadingPhoto);
                      }}
                    />
                    {uploadingPhoto ? (
                      <div className="ao-upload-uploading">
                        <span className="ao-spinner" style={{width:24,height:24,borderWidth:3}}/>
                        <span style={{fontSize:12,color:"rgba(180,140,255,0.6)"}}>Uploading photo...</span>
                      </div>
                    ) : form.restaurantPhotoPreview ? (
                      <div style={{position:"relative",width:"100%"}}>
                        <img src={form.restaurantPhotoPreview} className="ao-upload-preview" alt="preview"/>
                        {form.restaurantPhoto && (
                          <div style={{position:"absolute",bottom:6,right:8,background:"rgba(40,200,120,0.2)",border:"1px solid rgba(40,200,120,0.4)",borderRadius:8,padding:"2px 8px",fontSize:10,color:"#60d090"}}>
                            ✓ Uploaded
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ao-upload-content">
                        <span style={{fontSize:32}}>📸</span>
                        <span style={{fontSize:12,color:"rgba(180,140,255,0.45)"}}>Click to upload restaurant photo</span>
                        <span style={{fontSize:10,color:"rgba(160,96,240,0.35)"}}>JPG, PNG, WebP — max 5MB</span>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:"10px", margin:"12px 0", fontSize:"10px", color:isDark ? "rgba(180,140,255,0.4)" : "#6b21a8", fontWeight:600, letterSpacing:"0.1em"}}>
                    <div style={{flex:1, height:"1px", background:isDark ? "rgba(160,96,240,0.15)" : "rgba(168,85,247,0.2)"}} /> OR PASTE URL <div style={{flex:1, height:"1px", background:isDark ? "rgba(160,96,240,0.15)" : "rgba(168,85,247,0.2)"}} />
                  </div>
                  <input
                    className="ao-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={form.restaurantPhoto}
                    onChange={(e) => {
                      set("restaurantPhoto", e.target.value);
                      set("restaurantPhotoPreview", e.target.value);
                    }}
                  />
                </div>

                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button className="ao-btn-back" onClick={()=>setStep(1)}>← Back</button>
                  <button className="ao-btn-primary" style={{flex:1,marginTop:0}} disabled={uploadingPhoto} onClick={()=>goNext(3)}>
                    {uploadingPhoto ? <><span className="ao-spinner"/> Uploading...</> : "Continue →"}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3 — Restaurant Operations ── */}
            {step === 3 && (
              <>
                <div className="ao-step-title">⚙️ Restaurant Operations</div>
                <div className="ao-step-desc">Add operational details — timings, contact info, pricing & more.</div>

                {/* Description */}
                <div className="ao-field" style={{marginBottom:16}}>
                  <label className="ao-label">Description</label>
                  <textarea
                    className="ao-input"
                    rows={3}
                    placeholder="Short description of your restaurant..."
                    style={{resize:"vertical",minHeight:80}}
                    value={form.description}
                    onChange={e=>set("description",e.target.value)}
                  />
                </div>

                {/* Phone / Manager / Tel */}
                <div className="ao-grid3" style={{marginBottom:16}}>
                  <div className="ao-field">
                    <label className="ao-label">Phone Number *</label>
                    <input
                      className="ao-input"
                      placeholder="+91 98765 43210"
                      value={form.restaurantPhone}
                      onChange={e=>set("restaurantPhone",e.target.value)}
                      type="tel"
                    />
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Manager Contact</label>
                    <input
                      className="ao-input"
                      placeholder="Manager phone"
                      value={form.managerContact}
                      onChange={e=>set("managerContact",e.target.value)}
                      type="tel"
                    />
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Tel Number</label>
                    <input
                      className="ao-input"
                      placeholder="Landline"
                      value={form.telNumber}
                      onChange={e=>set("telNumber",e.target.value)}
                      type="tel"
                    />
                  </div>
                </div>

                {/* Opening / Closing / Price / Rating */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:16}}>
                  <div className="ao-field">
                    <label className="ao-label">Opening Time *</label>
                    <input
                      className="ao-input"
                      type="time"
                      value={form.openingTime}
                      onChange={e=>set("openingTime",e.target.value)}
                      style={{colorScheme:"dark"}}
                    />
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Closing Time *</label>
                    <input
                      className="ao-input"
                      type="time"
                      value={form.closingTime}
                      onChange={e=>set("closingTime",e.target.value)}
                      style={{colorScheme:"dark"}}
                    />
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Price Range</label>
                    <select
                      className="ao-select"
                      value={form.priceRange}
                      onChange={e=>set("priceRange",e.target.value)}
                    >
                      <option value="budget">💰 Budget</option>
                      <option value="mid">₹₹ Mid-range</option>
                      <option value="premium">₹₹₹ Premium</option>
                      <option value="fine">💎 Fine Dining</option>
                    </select>
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">Rating (0–5)</label>
                    <input
                      className="ao-input"
                      placeholder="4.5"
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={form.rating}
                      onChange={e=>set("rating",e.target.value)}
                    />
                  </div>
                </div>

                {/* Live preview so user can verify before proceeding */}
                {(form.openingTime || form.closingTime || form.priceRange) && (
                  <div style={{background:"rgba(160,96,240,0.07)",border:"1px solid rgba(160,96,240,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:12,color:"rgba(200,170,255,0.6)",display:"flex",gap:20,flexWrap:"wrap"}}>
                    {form.openingTime && form.closingTime && (
                      <span>🕐 {form.openingTime} – {form.closingTime}</span>
                    )}
                    {form.priceRange && (
                      <span>💰 {form.priceRange === "budget" ? "Budget" : form.priceRange === "mid" ? "Mid-range ₹₹" : form.priceRange === "premium" ? "Premium ₹₹₹" : "Fine Dining 💎"}</span>
                    )}
                    {form.rating && (
                      <span>⭐ {form.rating}/5</span>
                    )}
                  </div>
                )}

                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button className="ao-btn-back" onClick={()=>setStep(2)}>← Back</button>
                  <button className="ao-btn-primary" style={{flex:1,marginTop:0}} onClick={()=>goNext(4)}>Continue →</button>
                </div>
              </>
            )}

            {/* ── STEP 4 — Documents ── */}
            {step === 4 && (
              <>
                <div className="ao-step-title">📄 Document Verification</div>
                <div className="ao-step-desc">Your documents are encrypted and reviewed only by the SuperAdmin.</div>

                <div className="ao-field" style={{marginBottom:16}}>
                  <label className="ao-label">FSSAI License Number *</label>
                  <input className="ao-input" placeholder="14-digit FSSAI number" maxLength={14}
                    value={form.fssaiNumber} onChange={e=>set("fssaiNumber",e.target.value.replace(/\D/g,""))}/>
                  <div className="ao-hint">⚠️ Must be a valid 14-digit FSSAI license number.</div>
                </div>

                <div className="ao-field" style={{marginBottom:16}}>
                  <label className="ao-label">ID Proof Type *</label>
                  <div style={{display:"flex",gap:10}}>
                    {["aadhar","pan"].map(t => (
                      <button key={t} type="button"
                        onClick={()=>set("idProofType",t)}
                        style={{
                          flex:1, padding:"10px", borderRadius:10, cursor:"pointer",
                          border:`1px solid ${form.idProofType===t?"rgba(160,96,240,0.6)":"rgba(160,96,240,0.18)"}`,
                          background:form.idProofType===t?"rgba(160,96,240,0.18)":"rgba(255,255,255,0.03)",
                          color:form.idProofType===t?"#d0a0ff":"rgba(180,140,255,0.5)",
                          fontFamily:"'Montserrat',sans-serif", fontSize:12, fontWeight:600,
                          transition:"all 0.2s", letterSpacing:"0.06em"
                        }}>
                        {t === "aadhar" ? "🪪 Aadhar Card" : "💳 PAN Card"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ao-field" style={{marginBottom:4}}>
                  <label className="ao-label">Upload {form.idProofType === "aadhar" ? "Aadhar" : "PAN"} Card *</label>
                  <div className="ao-upload">
                    <input type="file" accept="image/*,.pdf"
                      disabled={uploadingIdProof}
                      onChange={e=>{
                        if(e.target.files?.[0])
                          handleFileUpload(e.target.files[0], "idProof", "idProofPreview", setUploadingIdProof);
                      }}
                    />
                    {uploadingIdProof ? (
                      <div className="ao-upload-uploading">
                        <span className="ao-spinner" style={{width:24,height:24,borderWidth:3}}/>
                        <span style={{fontSize:12,color:"rgba(180,140,255,0.6)"}}>Uploading document...</span>
                      </div>
                    ) : form.idProofPreview ? (
                      <div style={{position:"relative",width:"100%"}}>
                        <img src={form.idProofPreview} className="ao-upload-preview" alt="ID preview"/>
                        {form.idProof && (
                          <div style={{position:"absolute",bottom:6,right:8,background:"rgba(40,200,120,0.2)",border:"1px solid rgba(40,200,120,0.4)",borderRadius:8,padding:"2px 8px",fontSize:10,color:"#60d090"}}>
                            ✓ Uploaded
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ao-upload-content">
                        <span style={{fontSize:32}}>{form.idProofType==="aadhar"?"🪪":"💳"}</span>
                        <span style={{fontSize:12,color:"rgba(180,140,255,0.45)"}}>Upload {form.idProofType==="aadhar"?"Aadhar":"PAN"} Card</span>
                        <span style={{fontSize:10,color:"rgba(160,96,240,0.35)"}}>JPG, PNG, PDF — max 5MB</span>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:"10px", margin:"12px 0", fontSize:"10px", color:isDark ? "rgba(180,140,255,0.4)" : "#6b21a8", fontWeight:600, letterSpacing:"0.1em"}}>
                    <div style={{flex:1, height:"1px", background:isDark ? "rgba(160,96,240,0.15)" : "rgba(168,85,247,0.2)"}} /> OR PASTE URL <div style={{flex:1, height:"1px", background:isDark ? "rgba(160,96,240,0.15)" : "rgba(168,85,247,0.2)"}} />
                  </div>
                  <input
                    className="ao-input"
                    type="url"
                    placeholder="https://example.com/document.jpg"
                    value={form.idProof}
                    onChange={(e) => {
                      set("idProof", e.target.value);
                      set("idProofPreview", e.target.value);
                    }}
                  />
                  <div className="ao-hint" style={{ color: !isDark ? "#6b21a8" : undefined }}>🔒 Your document is stored securely and only visible to the SuperAdmin.</div>
                </div>

                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button className="ao-btn-back" onClick={()=>setStep(3)}>← Back</button>
                  <button className="ao-btn-primary" style={{flex:1,marginTop:0}} disabled={uploadingIdProof} onClick={()=>goNext(5)}>
                    {uploadingIdProof ? <><span className="ao-spinner"/> Uploading...</> : "Continue →"}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 5 — Plan + Duration ── */}
            {step === 5 && (
              <>
                <div className="ao-step-title">💎 Choose Your Plan</div>
                <div className="ao-step-desc">Select a plan and duration that suits your business needs.</div>

                <div className="ao-plans">
                  {PLANS.map(p => (
                    <div key={p.id} className={`ao-plan${form.plan===p.id?" sel":""}`}
                      style={{
                        background:form.plan===p.id?p.gradient:"rgba(255,255,255,0.03)",
                        borderColor:form.plan===p.id?p.border:"rgba(255,255,255,0.08)",
                        boxShadow:form.plan===p.id?`0 0 30px ${p.glow}`:"none",
                      }}
                      onClick={()=>set("plan",p.id)}>
                      <span className="ao-plan-icon">{p.icon}</span>
                      <div className="ao-plan-name" style={{color:form.plan===p.id?p.color:"rgba(220,200,255,0.8)"}}>{p.name}</div>
                      <div className="ao-plan-feat">
                        {p.features.map(f=><div key={f}>✓ {f}</div>)}
                      </div>
                    </div>
                  ))}
                </div>

                {form.plan && (
                  <>
                    <div className="ao-divider"/>
                    <div className="ao-label" style={{marginBottom:12}}>Select Duration</div>
                    <div className="ao-durations">
                      {DURATIONS.map(d => (
                        <button key={d.id} type="button" className={`ao-dur${form.duration===d.id?" sel":""}`}
                          onClick={()=>set("duration",d.id)}>
                          {d.label}
                          {d.discount>0 && <span className="ao-dur-discount">{d.discount}% off</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {form.plan && form.duration && (
                  <div className="ao-price-box">
                    <div style={{fontSize:11,color:"rgba(180,140,255,0.5)",letterSpacing:"0.1em",marginBottom:6}}>TOTAL AMOUNT</div>
                    <div style={{fontSize:36,fontWeight:700,color:"#d0a0ff",fontFamily:"'Cinzel',serif"}}>
                      ₹{selectedPrice?.toLocaleString()}
                    </div>
                    <div style={{fontSize:11,color:"rgba(180,140,255,0.4)",marginTop:4}}>
                      {selectedPlan?.name} Plan · {selectedDur?.label}
                      {(selectedDur?.discount ?? 0) > 0 && <span style={{color:"#60d090",marginLeft:8}}>({selectedDur?.discount}% saved)</span>}
                    </div>
                  </div>
                )}

                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button className="ao-btn-back" onClick={()=>setStep(4)}>← Back</button>
                  <button className="ao-btn-primary" style={{flex:1,marginTop:0}} disabled={!form.plan||!form.duration} onClick={()=>goNext(6)}>
                    Continue →
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 6 — Demo Payment ── */}
            {step === 6 && (
              <>
                <div className="ao-step-title">💳 Demo Payment</div>
                <div className="ao-step-desc">This is a demo payment — no real transaction will occur.</div>

                <div className="ao-card-3d" onClick={()=>setCardFlipped(p=>!p)}>
                  <div className={`ao-card-inner${cardFlipped?" flipped":""}`}>
                    <div className="ao-card-front">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:"rgba(200,170,255,0.6)",letterSpacing:"0.1em"}}>TableTime</div>
                        <div style={{fontSize:24}}>💳</div>
                      </div>
                      <div style={{fontFamily:"'Courier New',monospace",fontSize:18,letterSpacing:"0.2em",color:"rgba(230,210,255,0.9)",textAlign:"center"}}>
                        {form.cardNumber ? form.cardNumber.replace(/(.{4})/g,"$1 ").trim() : "•••• •••• •••• ••••"}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                        <div>
                          <div style={{fontSize:9,color:"rgba(180,140,255,0.4)",letterSpacing:"0.1em",marginBottom:3}}>CARD HOLDER</div>
                          <div style={{fontSize:13,color:"rgba(220,200,255,0.8)",fontFamily:"'Cinzel',serif",letterSpacing:"0.06em"}}>{form.cardName||"YOUR NAME"}</div>
                        </div>
                        <div>
                          <div style={{fontSize:9,color:"rgba(180,140,255,0.4)",letterSpacing:"0.1em",marginBottom:3}}>EXPIRES</div>
                          <div style={{fontSize:13,color:"rgba(220,200,255,0.8)"}}>{form.cardExpiry||"MM/YY"}</div>
                        </div>
                        <div style={{fontSize:11,color:"rgba(180,140,255,0.5)"}}>{selectedPlan?.icon} {selectedPlan?.name}</div>
                      </div>
                    </div>
                    <div className="ao-card-back">
                      <div style={{height:36,background:"rgba(0,0,0,0.4)",borderRadius:4,margin:"0 -24px"}}/>
                      <div style={{textAlign:"right",marginTop:16}}>
                        <div style={{fontSize:9,color:"rgba(180,140,255,0.4)",marginBottom:4,letterSpacing:"0.1em"}}>CVV</div>
                        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:6,padding:"6px 14px",display:"inline-block",fontFamily:"'Courier New',monospace",color:"rgba(220,200,255,0.8)",letterSpacing:"0.2em"}}>
                          {form.cardCvv||"•••"}
                        </div>
                      </div>
                      <div style={{fontSize:9,color:"rgba(180,140,255,0.3)",textAlign:"center"}}>Click card to flip</div>
                    </div>
                  </div>
                </div>

                <div className="ao-field" style={{marginBottom:14}}>
                  <label className="ao-label">Cardholder Name</label>
                  <input className="ao-input" placeholder="Name on card" value={form.cardName} onChange={e=>set("cardName",e.target.value.toUpperCase())}/>
                </div>
                <div className="ao-field" style={{marginBottom:14}}>
                  <label className="ao-label">Card Number</label>
                  <input className="ao-input" placeholder="1234 5678 9012 3456" maxLength={16} value={form.cardNumber} onChange={e=>set("cardNumber",e.target.value.replace(/\D/g,""))}/>
                </div>
                <div className="ao-grid2" style={{marginBottom:14}}>
                  <div className="ao-field">
                    <label className="ao-label">Expiry Date</label>
                    <input className="ao-input" placeholder="MM/YY" maxLength={5} value={form.cardExpiry}
                      onChange={e=>{ let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); set("cardExpiry",v); }}/>
                  </div>
                  <div className="ao-field">
                    <label className="ao-label">CVV</label>
                    <input className="ao-input" placeholder="•••" maxLength={3} type="password"
                      value={form.cardCvv} onChange={e=>set("cardCvv",e.target.value.replace(/\D/g,""))}
                      onFocus={()=>setCardFlipped(true)} onBlur={()=>setCardFlipped(false)}/>
                  </div>
                </div>

                <div style={{background:"rgba(160,96,240,0.07)",border:"1px solid rgba(160,96,240,0.18)",borderRadius:12,padding:"14px 18px",marginBottom:4}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,color:"rgba(180,140,255,0.5)"}}>Plan</span>
                    <span style={{fontSize:12,color:"rgba(220,200,255,0.8)"}}>{selectedPlan?.icon} {selectedPlan?.name} · {selectedDur?.label}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,fontWeight:700,color:"rgba(180,140,255,0.6)"}}>Total</span>
                    <span style={{fontSize:16,fontWeight:700,color:"#d0a0ff",fontFamily:"'Cinzel',serif"}}>₹{selectedPrice?.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button className="ao-btn-back" onClick={()=>setStep(5)}>← Back</button>
                  <button className="ao-btn-primary" style={{flex:1,marginTop:0}} disabled={submitting} onClick={handleSubmit}>
                    {submitting ? <><span className="ao-spinner"/> Processing...</> : <>🚀 Pay ₹{selectedPrice?.toLocaleString()} & Submit</>}
                  </button>
                </div>
                <div style={{textAlign:"center",marginTop:12,fontSize:10,color:"rgba(160,96,240,0.35)"}}>
                  🔒 Demo only — no real payment processed
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}