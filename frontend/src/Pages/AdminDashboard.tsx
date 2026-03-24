import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────
interface User {
  _id: string; name: string; email: string;
  role: "user" | "owner" | "superadmin";
  createdAt: string; isGoogleUser?: boolean;
  restaurant?: { _id: string; name: string; city: string } | string | null;
  isBlocked?: boolean;
}
interface Restaurant {
  _id: string; name: string; address: string; city: string;
  cuisineTypes: string[]; openingTime: string; closingTime: string;
  phoneNumber: string; managerContact: string; telNumber: string;
  rating: number; priceRange: string; image: string; imagePublicId?: string;
  description?: string; isActive: boolean; createdAt: string;
  addedBy?: string | null;
}
interface FoodItem {
  _id: string; name: string; description: string; price: number;
  offer: number; category: string; isVeg: boolean; spicyLevel: string;
  isAvailable: boolean; image: string; restaurant: string;
}
interface OwnerRequest {
  _id: string; name: string; email: string; ownerStatus: string; createdAt: string;
  ownerApplication?: {
    fullName: string; phone: string; country: string; state: string; city: string;
    restaurantName: string; restaurantType: string; address: string;
    cuisines: string[]; restaurantPhoto: string; fssaiNumber: string;
    idProofType: string; idProof: string;
    subscriptionPlan: string; subscriptionDuration: string; subscriptionPrice: number;
    appliedAt: string;
  };
}

type ActiveTab = "overview" | "users" | "restaurants" | "food" | "owner-requests" | "bookings" | "orders";

const API = "http://localhost:5000/api";
const CLOUDINARY_CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || "";
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

const CUISINES     = ["Indian","Italian","Chinese","Mexican","Japanese","Thai","Continental","Middle Eastern","American","Mediterranean"];
const CATEGORIES   = ["Starter","Main Course","Dessert","Beverage","Snacks","Breads","Rice & Biryani","Other"];
const SPICY_LEVELS = ["Mild","Medium","Hot","Extra Hot"];

// ─── Cloudinary Upload ───────────────────────────────────────────────────────
const uploadToCloudinary = async (file: File): Promise<{url:string;publicId:string}> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("folder", "tabletime");
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,{method:"POST",body:fd});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return { url: data.secure_url, publicId: data.public_id };
};

// ─── User Detail Modal ───────────────────────────────────────────────────────
function UserModal({ u, onClose }: { u: User; onClose: () => void }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(4,2,12,.82)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#0d0622",border:"1px solid rgba(160,96,240,.22)",borderRadius:20,padding:"32px 28px",maxWidth:420,width:"100%",boxShadow:"0 40px 100px rgba(0,0,0,.7)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#7030d0,#a060f0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",flexShrink:0}}>
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:600,color:"rgba(228,210,255,.9)",fontFamily:"'Cinzel',serif"}}>{u.name}</div>
            <div style={{fontSize:11,color:"rgba(180,150,255,.45)",marginTop:2}}>{u.email}</div>
          </div>
        </div>
        {([["Role",u.role],["Auth",u.isGoogleUser?"Google":"Email"],["Status",u.isBlocked?"🔴 Blocked":"🟢 Active"],["Joined",new Date(u.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})],["User ID",u._id]] as [string,string][]).map(([label,val])=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(160,96,240,.08)"}}>
            <span style={{fontSize:11,color:"rgba(180,140,255,.4)",letterSpacing:".06em",textTransform:"uppercase"}}>{label}</span>
            <span style={{fontSize:12,color:"rgba(215,195,255,.75)",fontWeight:500,wordBreak:"break-all",maxWidth:220,textAlign:"right"}}>{val}</span>
          </div>
        ))}
        <button onClick={onClose} style={{marginTop:22,width:"100%",padding:"11px",background:"rgba(160,96,240,.14)",border:"1px solid rgba(160,96,240,.25)",borderRadius:10,color:"#c090ff",fontFamily:"'Montserrat',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onCancel, danger = true }: { msg:string; onConfirm:()=>void; onCancel:()=>void; danger?: boolean }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(4,2,12,.85)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onCancel}>
      <div style={{background:"#0d0622",border:`1px solid ${danger?"rgba(240,80,80,.25)":"rgba(160,96,240,.25)"}`,borderRadius:20,padding:"32px 28px",maxWidth:380,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:52,height:52,borderRadius:"50%",background:danger?"rgba(240,80,80,.1)":"rgba(251,191,36,.1)",border:`2px solid ${danger?"rgba(240,80,80,.25)":"rgba(251,191,36,.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={danger?"#f07070":"#fbbf24"} strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:15,color:"rgba(228,210,255,.9)",marginBottom:8}}>Are you sure?</div>
        <div style={{fontSize:12,color:"rgba(180,140,255,.5)",marginBottom:24,lineHeight:1.6}}>{msg}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"10px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(160,96,240,.18)",borderRadius:10,color:"rgba(200,165,255,.6)",fontFamily:"'Montserrat',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",background:danger?"rgba(240,80,80,.18)":"rgba(251,191,36,.15)",border:`1px solid ${danger?"rgba(240,80,80,.3)":"rgba(251,191,36,.3)"}`,borderRadius:10,color:danger?"#f08080":"#fbbf24",fontFamily:"'Montserrat',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── UserRow ─────────────────────────────────────────────────────────────────
function UserRow({ u, isMe, roleLoading, assignLoading, blockLoading, removeOwnerLoading, onRoleChange, onAssignRestaurant, onDelete, onBlock, onViewDetail, onRemoveOwner, restaurants }: {
  u: User; isMe: boolean;
  roleLoading: string|null; assignLoading: string|null; blockLoading: string|null; removeOwnerLoading: string|null;
  onRoleChange: (userId:string, role:"user"|"owner"|"superadmin") => void;
  onAssignRestaurant: (userId:string, restaurantId:string) => void;
  onDelete: (userId:string, name:string) => void;
  onBlock: (userId:string, isBlocked:boolean) => void;
  onViewDetail: (u:User) => void;
  onRemoveOwner: (userId:string, name:string) => void;
  restaurants: Restaurant[];
}) {
  const restaurantId = typeof u.restaurant === "object" && u.restaurant !== null
    ? (u.restaurant as any)._id
    : (u.restaurant as string) || "";
  const assignedRest = restaurants.find(r => r._id === restaurantId)
    || (typeof u.restaurant === "object" && u.restaurant !== null ? u.restaurant as any : null);

  const [sel,     setSel]     = useState<"user"|"owner"|"superadmin">(u.role);
  const [restSel, setRestSel] = useState<string>(restaurantId);
  const [editing, setEditing] = useState(false);

  return (
    <tr style={{opacity:u.isBlocked?0.55:1}}>
      <td>
        <div className="ad-uc">
          <div className="ad-av" style={u.isBlocked?{background:"rgba(240,80,80,.15)",color:"#f07070",border:"1px solid rgba(240,80,80,.2)"}:{}}>
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="ad-un">
              {u.name}
              {isMe && <span style={{fontSize:9,marginLeft:6,color:"#a060f0"}}>YOU</span>}
              {u.isBlocked && <span style={{fontSize:9,marginLeft:6,color:"#f07070",background:"rgba(240,80,80,.12)",padding:"1px 5px",borderRadius:4}}>BLOCKED</span>}
            </div>
            <div className="ad-ue">{u.email}</div>
          </div>
        </div>
      </td>
      <td><span className={`ad-rb ${u.role}`}><span className="ad-rd"/>{u.role}</span></td>
      <td>{new Date(u.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
      <td><span className="ad-rb" style={{background:"rgba(60,140,240,.1)",color:"#70b0f0",border:"1px solid rgba(60,140,240,.2)"}}>{u.isGoogleUser?"Google":"Email"}</span></td>
      <td>
        {isMe ? <span style={{fontSize:11,color:"rgba(180,140,255,.28)"}}>Cannot change own</span> : (
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <select className="ad-select-sm" value={sel} onChange={e=>setSel(e.target.value as "user"|"owner"|"superadmin")}>
              <option value="user">User</option>
              <option value="owner">Owner</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <button className="ad-btn primary" disabled={sel===u.role||roleLoading===u._id} onClick={()=>onRoleChange(u._id,sel)}>
              {roleLoading===u._id ? <span className="ad-spinner"/> : "Save"}
            </button>
          </div>
        )}
      </td>
      <td>
        {u.role==="owner" ? (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {assignedRest && !editing ? (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:"#60d090",background:"rgba(40,200,120,.08)",padding:"4px 10px",borderRadius:6,border:"1px solid rgba(40,200,120,.18)",fontWeight:600}}>
                  ✅ {assignedRest.name}
                </span>
                <button className="ad-btn" title="Change Restaurant" onClick={()=>setEditing(true)}
                  style={{background:"rgba(60,140,240,.12)",color:"#70b0f0",border:"1px solid rgba(60,140,240,.2)"}}>
                  ✏️
                </button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {assignedRest && (
                  <span style={{fontSize:10,color:"rgba(180,140,255,.4)"}}>Current: {assignedRest.name}</span>
                )}
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <select className="ad-select-sm" value={restSel} onChange={e=>setRestSel(e.target.value)} style={{minWidth:130}}>
                    <option value="">-- Select --</option>
                    {restaurants.map(r=><option key={r._id} value={r._id}>{r.name} ({r.city})</option>)}
                  </select>
                  <button className="ad-btn primary" disabled={!restSel||assignLoading===u._id}
                    onClick={()=>{ onAssignRestaurant(u._id,restSel); setEditing(false); }}>
                    {assignLoading===u._id ? <span className="ad-spinner"/> : "Assign"}
                  </button>
                  {assignedRest && (
                    <button className="ad-btn" onClick={()=>setEditing(false)}
                      style={{background:"rgba(240,80,80,.1)",color:"#f07070",border:"1px solid rgba(240,80,80,.18)"}}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : <span style={{fontSize:11,color:"rgba(180,140,255,.2)"}}>—</span>}
      </td>
      <td>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <button className="ad-btn primary" title="View Details" onClick={()=>onViewDetail(u)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>

          {/* ✅ NEW: Remove Owner button — owner ko user mein downgrade karo */}
          {!isMe && u.role === "owner" && (
            <button className="ad-btn" title="Remove as Owner" disabled={removeOwnerLoading===u._id}
              onClick={()=>onRemoveOwner(u._id, u.name)}
              style={{background:"rgba(251,191,36,.12)",color:"#fbbf24",border:"1px solid rgba(251,191,36,.22)"}}>
              {removeOwnerLoading===u._id ? <span className="ad-spinner"/> : "👤 Remove Owner"}
            </button>
          )}

          {!isMe && (
            <button className="ad-btn" title={u.isBlocked?"Unblock":"Block"} disabled={blockLoading===u._id} onClick={()=>onBlock(u._id,!!u.isBlocked)}
              style={{background:u.isBlocked?"rgba(40,200,120,.12)":"rgba(240,140,40,.12)",color:u.isBlocked?"#60d090":"#f0a040",border:`1px solid ${u.isBlocked?"rgba(40,200,120,.2)":"rgba(240,140,40,.2)"}`}}>
              {blockLoading===u._id ? <span className="ad-spinner"/> : u.isBlocked ? "Unblock" : "Block"}
            </button>
          )}
          {!isMe && (
            <button className="ad-btn" title="Delete User" onClick={()=>onDelete(u._id,u.name)}
              style={{background:"rgba(240,80,80,.12)",color:"#f07070",border:"1px solid rgba(240,80,80,.2)"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate     = useNavigate();
  const token        = localStorage.getItem("token");
  const adminName    = localStorage.getItem("name")    || "Admin";
  const adminPicture = localStorage.getItem("picture") || "";

  const [activeTab,          setActiveTab]          = useState<ActiveTab>("overview");
  const [users,              setUsers]              = useState<User[]>([]);
  const [restaurants,        setRestaurants]        = useState<Restaurant[]>([]);
  const [foodItems,          setFoodItems]          = useState<FoodItem[]>([]);
  const [ownerRequests,      setOwnerRequests]      = useState<OwnerRequest[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [roleLoading,        setRoleLoading]        = useState<string|null>(null);
  const [assignLoading,      setAssignLoading]      = useState<string|null>(null);
  const [blockLoading,       setBlockLoading]       = useState<string|null>(null);
  const [removeOwnerLoading, setRemoveOwnerLoading] = useState<string|null>(null); // ✅ NEW
  const [reqLoading,         setReqLoading]         = useState<string|null>(null);
  const [restDelLoading,     setRestDelLoading]     = useState<string|null>(null);
  const [toast,              setToast]              = useState<{msg:string;type:"success"|"error"}|null>(null);
  const [searchQ,            setSearchQ]            = useState("");
  const [roleFilter,         setRoleFilter]         = useState<"all"|"user"|"owner"|"superadmin">("all");
  const [sidebarOpen,        setSidebarOpen]        = useState(true);
  const [imgUploading,       setImgUploading]       = useState(false);
  const [modalUser,          setModalUser]          = useState<User|null>(null);
  const [confirmDel,         setConfirmDel]         = useState<{id:string;name:string}|null>(null);
  const [confirmRestDel,     setConfirmRestDel]     = useState<{id:string;name:string}|null>(null);
  const [confirmRemoveOwner, setConfirmRemoveOwner] = useState<{id:string;name:string}|null>(null); // ✅ NEW
  const [restSearch,         setRestSearch]         = useState("");

  const [restForm, setRestForm] = useState({ name:"",description:"",address:"",city:"",phoneNumber:"",managerContact:"",telNumber:"",cuisineTypes:[] as string[],openingTime:"",closingTime:"",rating:"",priceRange:"₹₹",image:"",imagePublicId:"" });
  const [restImgPreview, setRestImgPreview] = useState("");
  const [restSubmitting, setRestSubmitting] = useState(false);
  const [editingRestId,  setEditingRestId]  = useState<string|null>(null);
  const [editingFoodId,  setEditingFoodId]  = useState<string|null>(null);
  const [foodForm, setFoodForm] = useState({ name:"",description:"",price:"",offer:"0",category:"Other",isVeg:true,spicyLevel:"Medium",isAvailable:true,restaurant:"",image:"",imagePublicId:"" });
  const [foodImgPreview, setFoodImgPreview] = useState("");
  const [foodSubmitting, setFoodSubmitting] = useState(false);

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "superadmin") navigate("/unauthorized",{replace:true});
  }, [token, navigate]);

  const showToast = (msg:string, type:"success"|"error") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const authHeader = { Authorization: `Bearer ${token}` };
  const handleUnauthorized = () => { localStorage.clear(); showToast("Session expired.","error"); navigate("/",{replace:true}); };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/users`,{headers:authHeader});
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { if(res.status===401||res.status===403) return handleUnauthorized(); return; }
      setUsers(Array.isArray(data.users)?data.users:[]);
    } catch {}
  }, [token]);

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch(`${API}/restaurants`,{headers:authHeader});
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { if(res.status===401||res.status===403) return handleUnauthorized(); return; }
      setRestaurants(Array.isArray(data.restaurants)?data.restaurants:[]);
    } catch {}
  }, [token]);

  const fetchOwnerRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/owner-requests`,{headers:authHeader});
      const data = await res.json().catch(()=>({}));
      if (res.ok) setOwnerRequests(Array.isArray(data.requests)?data.requests:[]);
    } catch {}
  }, [token]);

  const fetchFoodItems = async (restaurantId:string) => {
    if (!restaurantId) return;
    const res = await fetch(`${API}/restaurants/${restaurantId}/food`,{headers:authHeader});
    const data = await res.json();
    if (data.success) setFoodItems(data.foodItems);
  };

  useEffect(() => {
    const init = async () => { setLoading(true); await Promise.all([fetchUsers(),fetchRestaurants(),fetchOwnerRequests()]); setLoading(false); };
    init();
  }, [fetchUsers,fetchRestaurants,fetchOwnerRequests]);

  const handleRefresh = async () => { setLoading(true); await Promise.all([fetchUsers(),fetchRestaurants(),fetchOwnerRequests()]); setLoading(false); showToast("Data refreshed!","success"); };

  const handleImageUpload = async (file:File, type:"rest"|"food") => {
    setImgUploading(true);
    try {
      const {url,publicId} = await uploadToCloudinary(file);
      if (type==="rest") { setRestForm(p=>({...p,image:url,imagePublicId:publicId})); setRestImgPreview(url); }
      else               { setFoodForm(p=>({...p,image:url,imagePublicId:publicId})); setFoodImgPreview(url); }
      showToast("Image uploaded!","success");
    } catch { showToast("Image upload failed","error"); }
    finally { setImgUploading(false); }
  };

  const resetRestForm = () => {
    setRestForm({name:"",description:"",address:"",city:"",phoneNumber:"",managerContact:"",telNumber:"",cuisineTypes:[],openingTime:"",closingTime:"",rating:"",priceRange:"₹₹",image:"",imagePublicId:""});
    setRestImgPreview(""); setEditingRestId(null);
  };

  const handleEditClick = (r: Restaurant) => {
    setRestForm({ name:r.name, description:r.description||"", address:r.address, city:r.city, phoneNumber:r.phoneNumber||"", managerContact:r.managerContact||"", telNumber:r.telNumber||"", cuisineTypes:r.cuisineTypes||[], openingTime:r.openingTime||"", closingTime:r.closingTime||"", rating:String(r.rating||""), priceRange:r.priceRange||"₹₹", image:r.image||"", imagePublicId:r.imagePublicId||"" });
    setRestImgPreview(r.image||""); setEditingRestId(r._id);
    setTimeout(()=>document.getElementById("rest-form")?.scrollIntoView({behavior:"smooth"}),100);
  };

  const handleAddRestaurant = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!restForm.name||!restForm.address||!restForm.city) return showToast("Name, address and city required","error");
    setRestSubmitting(true);
    try {
      const isEdit = !!editingRestId;
      const url    = isEdit ? `${API}/restaurants/${editingRestId}` : `${API}/restaurants`;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url,{method,headers:{"Content-Type":"application/json",...authHeader},body:JSON.stringify({...restForm,rating:Number(restForm.rating)||0})});
      const data   = await res.json();
      if (res.ok) { showToast(isEdit?"Restaurant updated!":"Restaurant added!","success"); resetRestForm(); fetchRestaurants(); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setRestSubmitting(false); }
  };

  const handleDeleteRestaurant = async (id:string) => {
    setRestDelLoading(id);
    try {
      const res = await fetch(`${API}/restaurants/${id}`,{method:"DELETE",headers:authHeader});
      const data = await res.json();
      if (res.ok) { showToast("Restaurant deleted!","success"); fetchRestaurants(); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setRestDelLoading(null); setConfirmRestDel(null); }
  };

  const handleAddFoodItem = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name||!foodForm.price||!foodForm.restaurant) return showToast("Name, price and restaurant required","error");
    setFoodSubmitting(true);
    try {
      const isEdit = !!editingFoodId;
      const url    = isEdit ? `${API}/restaurants/food/${editingFoodId}` : `${API}/restaurants/food`;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url,{method,headers:{"Content-Type":"application/json",...authHeader},body:JSON.stringify({...foodForm,price:Number(foodForm.price),offer:Number(foodForm.offer)||0})});
      const data   = await res.json();
      if (res.ok) { showToast(isEdit?"Food item updated!":"Food item added!","success"); resetFoodForm(); fetchFoodItems(foodForm.restaurant); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setFoodSubmitting(false); }
  };

  const handleRoleChange = async (userId:string, newRole:"user"|"owner"|"superadmin") => {
    setRoleLoading(userId);
    try {
      const res = await fetch(`${API}/admin/users/role`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeader},body:JSON.stringify({userId,role:newRole})});
      const data = await res.json();
      if (res.ok) { showToast(`Role → ${newRole}`,"success"); fetchUsers(); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setRoleLoading(null); }
  };

  const handleAssignRestaurant = async (userId:string, restaurantId:string) => {
    setAssignLoading(userId);
    try {
      const res = await fetch(`${API}/admin/assign-restaurant`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeader},body:JSON.stringify({userId,restaurantId})});
      const data = await res.json();
      if (res.ok) {
        showToast("Restaurant assigned!","success");
        setUsers(prev => prev.map(u => {
          if (u._id !== userId) return u;
          const rest = restaurants.find(r => r._id === restaurantId);
          return { ...u, restaurant: rest ? { _id: rest._id, name: rest.name, city: rest.city } : restaurantId };
        }));
        // ✅ Restaurant ka addedBy bhi update karo local state mein
        setRestaurants(prev => prev.map(r => r._id === restaurantId ? {...r, addedBy: userId} : r));
      } else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setAssignLoading(null); }
  };

  // ✅ NEW: Remove Owner handler
  const handleRemoveOwner = async (userId:string) => {
    setRemoveOwnerLoading(userId);
    try {
      const res = await fetch(`${API}/admin/remove-owner`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeader},body:JSON.stringify({userId})});
      const data = await res.json();
      if (res.ok) {
        showToast("Owner removed! Restaurant is now unassigned. ✅","success");
        // ✅ Users aur restaurants dono update karo
        await Promise.all([fetchUsers(), fetchRestaurants()]);
      } else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setRemoveOwnerLoading(null); setConfirmRemoveOwner(null); }
  };

  const handleBlockUser = async (userId:string, isBlocked:boolean) => {
    setBlockLoading(userId);
    try {
      const res = await fetch(`${API}/admin/users/block`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeader},body:JSON.stringify({userId,isBlocked:!isBlocked})});
      const data = await res.json();
      if (res.ok) { showToast(isBlocked?"User unblocked!":"User blocked!","success"); fetchUsers(); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setBlockLoading(null); }
  };

  const handleDeleteUser = async (userId:string) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}`,{method:"DELETE",headers:authHeader});
      const data = await res.json();
      if (res.ok) {
        showToast("User deleted! Associated restaurant unassigned. ✅","success");
        // ✅ Dono fetch karo — restaurant ka addedBy null ho gaya hoga
        await Promise.all([fetchUsers(), fetchRestaurants()]);
      } else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setConfirmDel(null); }
  };

  const handleOwnerRequest = async (userId:string, action:"approve"|"reject") => {
    setReqLoading(userId+action);
    try {
      const res = await fetch(`${API}/admin/owner-requests/${userId}/${action}`,{method:"PATCH",headers:authHeader});
      const data = await res.json();
      if (res.ok) { showToast(data.message,"success"); fetchOwnerRequests(); fetchUsers(); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
    finally { setReqLoading(null); }
  };

  const toggleRestaurant = async (id:string) => {
    const res = await fetch(`${API}/restaurants/${id}/toggle`,{method:"PATCH",headers:authHeader});
    const data = await res.json();
    if (res.ok) { showToast(data.message,"success"); fetchRestaurants(); }
  };

  const resetFoodForm = () => {
    setFoodForm({name:"",description:"",price:"",offer:"0",category:"Other",isVeg:true,spicyLevel:"Medium",isAvailable:true,restaurant:foodForm.restaurant,image:"",imagePublicId:""});
    setFoodImgPreview(""); setEditingFoodId(null);
  };

  const handleFoodEditClick = (f: FoodItem) => {
    setFoodForm({ name:f.name, description:f.description||"", price:String(f.price), offer:String(f.offer||0), category:f.category, isVeg:f.isVeg, spicyLevel:f.spicyLevel, isAvailable:f.isAvailable, restaurant:f.restaurant, image:f.image||"", imagePublicId:"" });
    setFoodImgPreview(f.image||""); setEditingFoodId(f._id);
    setTimeout(()=>document.getElementById("food-form")?.scrollIntoView({behavior:"smooth"}),100);
  };

  const handleDeleteFoodItem = async (id:string) => {
    try {
      const res  = await fetch(`${API}/restaurants/food/${id}`,{method:"DELETE",headers:authHeader});
      const data = await res.json();
      if (res.ok) { showToast("Food item deleted!","success"); if(foodForm.restaurant) fetchFoodItems(foodForm.restaurant); }
      else showToast(data.message||"Failed","error");
    } catch { showToast("Network error","error"); }
  };

  const toggleFood = async (id:string) => {
    const res = await fetch(`${API}/restaurants/food/${id}/toggle`,{method:"PATCH",headers:authHeader});
    const data = await res.json();
    if (res.ok) { showToast(data.message,"success"); if(foodForm.restaurant) fetchFoodItems(foodForm.restaurant); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/",{replace:true}); };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQ.toLowerCase()) || u.email.toLowerCase().includes(searchQ.toLowerCase());
    const matchRole   = roleFilter==="all" || u.role===roleFilter;
    return matchSearch && matchRole;
  });

  // ✅ Analytics helpers
  const unassignedRestaurants = restaurants.filter(r => !r.addedBy);
  const blockedUsers          = users.filter(u => u.isBlocked);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0a0418",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"Montserrat,sans-serif"}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:"2px solid rgba(160,96,240,.15)",borderTopColor:"#a060f0",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:11,color:"rgba(180,140,255,.4)",letterSpacing:"0.2em"}}>LOADING DASHBOARD</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Cinzel:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes ad-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ad-scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        @keyframes ad-spin{to{transform:rotate(360deg)}}
        @keyframes ad-toast{from{opacity:0;transform:translateY(14px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .ad-root{min-height:100vh;background:#0a0418;color:#f0ebff;font-family:'Montserrat',sans-serif;display:flex}
        .ad-sb{width:240px;min-width:240px;background:rgba(255,255,255,.025);border-right:1px solid rgba(160,96,240,.12);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;transition:width .3s,min-width .3s}
        .ad-sb.col{width:68px;min-width:68px}
        .ad-sb-logo{display:flex;align-items:center;gap:10px;padding:22px 18px 18px;border-bottom:1px solid rgba(160,96,240,.1);text-decoration:none}
        .ad-logo-ic{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#7030d0,#a060f0);display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(130,60,220,.35)}
        .ad-logo-tx{font-family:'Cinzel',serif;font-size:15px;font-weight:500;letter-spacing:.06em;white-space:nowrap;background:linear-gradient(135deg,#d4b0ff,#f0e0ff,#a070e0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .ad-logo-bd{font-size:8px;font-weight:600;letter-spacing:.12em;background:rgba(160,96,240,.2);color:#c090ff;border:1px solid rgba(160,96,240,.3);padding:2px 7px;border-radius:20px;white-space:nowrap}
        .ad-sb.col .ad-logo-tx,.ad-sb.col .ad-logo-bd{opacity:0;width:0;overflow:hidden}
        .ad-nav{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:3px}
        .ad-ni{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:8px;border:none;background:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;letter-spacing:.04em;color:rgba(200,165,255,.38);transition:all .2s;white-space:nowrap;width:100%;text-align:left}
        .ad-ni:hover{color:rgba(215,185,255,.78);background:rgba(160,96,240,.08)}
        .ad-ni.active{color:#e0c4ff;background:rgba(160,96,240,.16)}
        .ad-ni-ic{flex-shrink:0;opacity:.4;transition:opacity .2s}
        .ad-ni:hover .ad-ni-ic,.ad-ni.active .ad-ni-ic{opacity:1}
        .ad-ni-lb{transition:opacity .2s;flex:1}
        .ad-sb.col .ad-ni-lb{opacity:0;width:0;overflow:hidden}
        .ad-ni-badge{min-width:18px;height:18px;border-radius:9px;background:rgba(240,80,80,.25);color:#f08080;border:1px solid rgba(240,80,80,.3);font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px}
        .ad-sb.col .ad-ni-badge{display:none}
        .ad-sb-ft{padding:14px 10px;border-top:1px solid rgba(160,96,240,.1)}
        .ad-logout{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:8px;border:none;background:none;cursor:pointer;width:100%;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;color:rgba(255,140,140,.5);transition:all .2s}
        .ad-logout:hover{color:rgba(255,160,160,.88);background:rgba(255,80,80,.08)}
        .ad-tb{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:64px;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(160,96,240,.1);position:sticky;top:0;z-index:50;backdrop-filter:blur(20px)}
        .ad-tb-l{display:flex;align-items:center;gap:14px}
        .ad-tb-r{display:flex;align-items:center;gap:10px}
        .ad-cb{width:32px;height:32px;border-radius:7px;border:none;background:rgba(160,96,240,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(200,165,255,.6);transition:all .2s}
        .ad-cb:hover{background:rgba(160,96,240,.15);color:#d090ff}
        .ad-pt{font-family:'Cinzel',serif;font-size:15px;font-weight:500;color:rgba(220,200,255,.78);letter-spacing:.06em}
        .ad-chip{display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:rgba(160,96,240,.1);border:1px solid rgba(160,96,240,.2)}
        .ad-chip-lb{font-size:11px;font-weight:500;color:rgba(200,165,255,.8);letter-spacing:.06em}
        .ad-main{flex:1;display:flex;flex-direction:column;min-width:0}
        .ad-content{flex:1;padding:28px 32px;overflow-y:auto}
        .ad-sg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;animation:ad-fadeUp .5s ease both}
        .ad-sg-6{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;animation:ad-fadeUp .5s ease both}
        .ad-sc{background:rgba(255,255,255,.03);border:1px solid rgba(160,96,240,.1);border-radius:14px;padding:18px 20px;transition:all .22s}
        .ad-sc:hover{background:rgba(160,96,240,.06);border-color:rgba(160,96,240,.22);transform:translateY(-2px)}
        .ad-sc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ad-sc-ic{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px}
        .s-purple{background:rgba(160,96,240,.14);border:1px solid rgba(160,96,240,.22)}
        .s-blue{background:rgba(60,140,240,.12);border:1px solid rgba(60,140,240,.2)}
        .s-green{background:rgba(40,200,120,.1);border:1px solid rgba(40,200,120,.18)}
        .s-orange{background:rgba(240,140,40,.1);border:1px solid rgba(240,140,40,.18)}
        .s-red{background:rgba(240,80,80,.1);border:1px solid rgba(240,80,80,.18)}
        .s-yellow{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.18)}
        .ad-sc-tag{font-size:9px;font-weight:600;letter-spacing:.1em;padding:3px 9px;border-radius:20px}
        .tag-purple{background:rgba(160,96,240,.15);color:#c090ff;border:1px solid rgba(160,96,240,.22)}
        .tag-blue{background:rgba(60,140,240,.12);color:#70b0f0;border:1px solid rgba(60,140,240,.2)}
        .tag-green{background:rgba(40,200,120,.1);color:#60d090;border:1px solid rgba(40,200,120,.18)}
        .tag-orange{background:rgba(240,140,40,.1);color:#f0a040;border:1px solid rgba(240,140,40,.18)}
        .tag-red{background:rgba(240,80,80,.1);color:#f07070;border:1px solid rgba(240,80,80,.18)}
        .tag-yellow{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.18)}
        .ad-sc-num{font-family:'Cinzel',serif;font-size:28px;font-weight:600;color:rgba(228,210,255,.9);line-height:1;margin-bottom:5px}
        .ad-sc-lb{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(180,140,255,.38)}
        .ad-card{background:rgba(255,255,255,.025);border:1px solid rgba(160,96,240,.1);border-radius:16px;overflow:hidden;margin-bottom:20px;animation:ad-scaleIn .4s ease both}
        .ad-card-hd{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(160,96,240,.08);flex-wrap:wrap;gap:10px}
        .ad-card-title{font-family:'Cinzel',serif;font-size:13px;font-weight:500;color:rgba(220,200,255,.72);letter-spacing:.06em}
        .ad-card-sub{font-size:11px;color:rgba(180,140,255,.38)}
        .ad-form{display:flex;flex-direction:column;gap:16px;padding:22px}
        .ad-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ad-form-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        .ad-field{display:flex;flex-direction:column;gap:6px}
        .ad-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(180,140,255,.45)}
        .ad-input{background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.18);border-radius:9px;padding:10px 13px;font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(215,195,255,.85);outline:none;transition:border-color .2s}
        .ad-input:focus{border-color:rgba(160,96,240,.5);background:rgba(160,96,240,.06)}
        .ad-input::placeholder{color:rgba(180,140,255,.22)}
        .ad-textarea{background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.18);border-radius:9px;padding:10px 13px;font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(215,195,255,.85);outline:none;resize:vertical;min-height:88px;transition:border-color .2s}
        .ad-textarea:focus{border-color:rgba(160,96,240,.5)}
        .ad-select{background:rgba(10,4,24,.95);border:1px solid rgba(160,96,240,.18);border-radius:9px;padding:10px 13px;font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(200,165,255,.8);cursor:pointer;outline:none;width:100%}
        .ad-cuisine-grid{display:flex;flex-wrap:wrap;gap:7px;padding-top:2px}
        .ad-cuisine-tag{background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.15);border-radius:20px;padding:5px 13px;font-family:'Montserrat',sans-serif;font-size:11px;color:rgba(180,140,255,.5);cursor:pointer;transition:all .18s}
        .ad-cuisine-tag.sel{background:rgba(160,96,240,.18);border-color:rgba(160,96,240,.4);color:#d0a0ff}
        .ad-img-wrap{position:relative;width:100%;height:140px;border:1.5px dashed rgba(160,96,240,.22);border-radius:10px;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .ad-img-wrap input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;z-index:2}
        .ad-img-placeholder{display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
        .ad-img-ic{width:40px;height:40px;border-radius:10px;background:rgba(160,96,240,.1);border:1px solid rgba(160,96,240,.2);display:flex;align-items:center;justify-content:center}
        .ad-img-txt{font-size:12px;color:rgba(180,140,255,.4);text-align:center;line-height:1.5}
        .ad-img-preview{width:100%;height:100%;object-fit:cover;pointer-events:none}
        .ad-veg-row{display:flex;gap:8px}
        .ad-veg-pill{padding:7px 16px;border-radius:20px;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;transition:all .18s}
        .ad-veg-pill.veg{background:rgba(40,200,120,.08);border:1px solid rgba(40,200,120,.18);color:rgba(60,200,100,.5)}
        .ad-veg-pill.veg.sel{background:rgba(40,200,120,.18);border-color:rgba(40,200,120,.4);color:#60d090}
        .ad-veg-pill.nonveg{background:rgba(240,80,80,.06);border:1px solid rgba(240,80,80,.14);color:rgba(240,100,100,.45)}
        .ad-veg-pill.nonveg.sel{background:rgba(240,80,80,.16);border-color:rgba(240,80,80,.35);color:#f07070}
        .ad-toggle-wrap{display:flex;align-items:center;gap:10px}
        .ad-toggle{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
        .ad-toggle.on{background:rgba(160,96,240,.5)}
        .ad-toggle.off{background:rgba(255,255,255,.1)}
        .ad-toggle-knob{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.3)}
        .ad-toggle.on .ad-toggle-knob{left:21px}
        .ad-toggle.off .ad-toggle-knob{left:3px}
        .ad-toggle-lb{font-size:12px;color:rgba(200,165,255,.6)}
        .ad-submit{padding:12px 28px;background:linear-gradient(135deg,#7030d0,#5010b0);border:none;border-radius:10px;color:#fff;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:opacity .2s,transform .15s;box-shadow:0 4px 20px rgba(112,48,208,.3)}
        .ad-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .ad-submit:disabled{opacity:.5;cursor:wait}
        .ad-table{width:100%;border-collapse:collapse}
        .ad-table th{font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(200,165,255,.28);padding:11px 20px;border-bottom:1px solid rgba(160,96,240,.08);text-align:left}
        .ad-table td{padding:13px 20px;font-size:12px;border-bottom:1px solid rgba(160,96,240,.05);color:rgba(215,195,255,.65)}
        .ad-table tr:last-child td{border-bottom:none}
        .ad-table tr:hover td{background:rgba(160,96,240,.04)}
        .ad-uc{display:flex;align-items:center;gap:11px}
        .ad-av{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;background:rgba(160,96,240,.18);color:#c090ff;border:1px solid rgba(160,96,240,.2)}
        .ad-un{font-weight:500;color:rgba(228,210,255,.85);font-size:13px}
        .ad-ue{font-size:10px;color:rgba(180,150,255,.38);margin-top:1px}
        .ad-rb{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
        .ad-rb.superadmin{background:rgba(160,96,240,.18);color:#c090ff;border:1px solid rgba(160,96,240,.25)}
        .ad-rb.owner{background:rgba(240,140,40,.12);color:#f0a040;border:1px solid rgba(240,140,40,.22)}
        .ad-rb.user{background:rgba(40,200,120,.1);color:#60d090;border:1px solid rgba(40,200,120,.2)}
        .ad-rd{width:5px;height:5px;border-radius:50%}
        .ad-rb.superadmin .ad-rd{background:#a060f0;box-shadow:0 0 6px rgba(160,96,240,.8)}
        .ad-rb.owner .ad-rd{background:#f0a040}
        .ad-rb.user .ad-rd{background:#40c080}
        .ad-status{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600}
        .ad-status.on{background:rgba(40,200,120,.1);color:#60d090;border:1px solid rgba(40,200,120,.2)}
        .ad-status.off{background:rgba(240,80,80,.1);color:#f07070;border:1px solid rgba(240,80,80,.2)}
        .ad-status.unassigned{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.2)}
        .ad-select-sm{background:rgba(10,4,24,.95);border:1px solid rgba(160,96,240,.18);border-radius:7px;padding:5px 9px;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:500;color:rgba(200,165,255,.72);cursor:pointer;outline:none}
        .ad-btn{border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:.06em;padding:5px 11px;border-radius:6px;transition:all .2s;display:inline-flex;align-items:center;gap:5px}
        .ad-btn.primary{background:rgba(160,96,240,.18);color:#c090ff;border:1px solid rgba(160,96,240,.25)}
        .ad-btn.primary:hover{background:rgba(160,96,240,.3)}
        .ad-btn:disabled{opacity:.4;cursor:wait}
        .ad-spinner{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid rgba(160,96,240,.2);border-top-color:#a060f0;animation:ad-spin .7s linear infinite}
        .ad-filter-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .ad-filter-pill{background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.14);border-radius:20px;padding:5px 14px;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;color:rgba(180,140,255,.45);cursor:pointer;transition:all .18s}
        .ad-filter-pill.active{background:rgba(160,96,240,.18);border-color:rgba(160,96,240,.35);color:#d0a0ff}
        .ad-search-wrap{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.14);border-radius:8px;padding:0 11px;height:34px}
        .ad-search-wrap:focus-within{border-color:rgba(160,96,240,.38)}
        .ad-search-in{background:none;border:none;outline:none;font-family:'Montserrat',sans-serif;font-size:12px;color:rgba(215,195,255,.8);width:180px}
        .ad-search-in::placeholder{color:rgba(180,140,255,.22)}
        .ad-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:9999;padding:11px 22px;border-radius:12px;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;letter-spacing:.04em;white-space:nowrap;animation:ad-toast .3s ease both;backdrop-filter:blur(20px)}
        .ad-toast.success{background:rgba(40,180,100,.18);border:1px solid rgba(40,180,100,.3);color:#60e0a0}
        .ad-toast.error{background:rgba(220,60,60,.18);border:1px solid rgba(220,60,60,.3);color:#f08080}
        .ad-empty{padding:44px;text-align:center;color:rgba(180,140,255,.28);font-size:12px}
        .ad-rest-img{width:42px;height:42px;border-radius:8px;object-fit:cover;flex-shrink:0}
        .ad-rest-img-placeholder{width:42px;height:42px;border-radius:8px;background:rgba(160,96,240,.12);border:1px solid rgba(160,96,240,.18);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .ad-price-range{font-family:'Cinzel',serif;font-size:12px;color:#c090ff}
        .ad-uploading{display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(180,140,255,.6)}
        .ad-req-card{background:rgba(255,255,255,.03);border:1px solid rgba(160,96,240,.1);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:background .2s}
        .ad-req-card:hover{background:rgba(160,96,240,.06)}
        .ad-alert-banner{background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.18);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:18px;animation:ad-fadeUp .5s ease both}
        .ad-alert-banner-text{font-size:12px;color:rgba(251,191,36,.85);line-height:1.5}
      `}</style>

      <div className="ad-root">
        {/* ── SIDEBAR ── */}
        <aside className={`ad-sb${sidebarOpen?"":" col"}`}>
          <a className="ad-sb-logo" href="/dashboard">
            <div className="ad-logo-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h2l2 5 4-10 3 7 2-4h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <span className="ad-logo-tx">TableTime</span>
            <span className="ad-logo-bd">Admin</span>
          </a>
          <nav className="ad-nav">
            {([
              {id:"overview",       label:"Overview",       icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>},
              {id:"users",          label:"Users",          icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>},
              {id:"owner-requests", label:"Owner Requests", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, badge:ownerRequests.length},
              {id:"restaurants",    label:"Restaurants",    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 2v7c0 1.1.9 2 2 2h4v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 2v20M18 2v6a4 4 0 01-4 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, badge: unassignedRestaurants.length || 0},
              {id:"food",           label:"Food Items",     icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>},
              {id:"bookings",       label:"Bookings",       icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>},
              {id:"orders",         label:"Orders",         icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>},
            ] as {id:ActiveTab;label:string;icon:React.ReactNode;badge?:number}[]).map(item=>(
              <button key={item.id} className={`ad-ni${activeTab===item.id?" active":""}`} onClick={()=>setActiveTab(item.id)}>
                <span className="ad-ni-ic">{item.icon}</span>
                <span className="ad-ni-lb">{item.label}</span>
                {item.badge && item.badge>0 ? <span className="ad-ni-badge">{item.badge}</span> : null}
              </button>
            ))}
          </nav>
          <div className="ad-sb-ft">
            <button className="ad-logout" onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.6}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              <span className="ad-ni-lb">Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="ad-main">
          <div className="ad-tb">
            <div className="ad-tb-l">
              <button className="ad-cb" onClick={()=>setSidebarOpen(p=>!p)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
              <span className="ad-pt">{activeTab==="overview"?"Dashboard Overview":activeTab==="users"?"User Management":activeTab==="owner-requests"?"Owner Requests":activeTab==="restaurants"?"Restaurant Management":activeTab==="food"?"Food Items":activeTab==="bookings"?"Bookings":"Orders"}</span>
            </div>
            <div className="ad-tb-r">
              <button className="ad-cb" onClick={handleRefresh} title="Refresh">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              </button>
              <div className="ad-chip" style={{padding:adminPicture?"4px 14px 4px 4px":"6px 14px"}}>
                {adminPicture
                  ? <img src={adminPicture} alt={adminName} referrerPolicy="no-referrer" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
                  : <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#7030d0,#a060f0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{adminName.charAt(0).toUpperCase()}</div>
                }
                <span className="ad-chip-lb">{adminName}</span>
              </div>
            </div>
          </div>

          <div className="ad-content">

            {/* ══ OVERVIEW ══ */}
            {activeTab==="overview" && (
              <>
                {/* ✅ Alert: Unassigned restaurants */}
                {unassignedRestaurants.length > 0 && (
                  <div className="ad-alert-banner">
                    <span style={{fontSize:20}}>⚠️</span>
                    <div className="ad-alert-banner-text">
                      <strong>{unassignedRestaurants.length} restaurant{unassignedRestaurants.length>1?"s":""}</strong> ke owner remove ho gaye hain aur abhi koi bhi assign nahi hai.{" "}
                      <button onClick={()=>setActiveTab("restaurants")} style={{background:"none",border:"none",color:"#fbbf24",cursor:"pointer",fontWeight:600,textDecoration:"underline",fontSize:12}}>
                        Restaurants tab mein assign karo →
                      </button>
                    </div>
                  </div>
                )}

                {/* ✅ Stats — 6 cards */}
                <div className="ad-sg-6">
                  {[
                    {num:users.length,                              lbl:"Total Users",          icon:"👥",cls:"s-purple",tag:"tag-purple",tagTxt:"All",        tab:"users",        filter:"all"},
                    {num:users.filter(u=>u.role==="owner").length,  lbl:"Owners",               icon:"🏪",cls:"s-orange",tag:"tag-orange",tagTxt:"Active",      tab:"users",        filter:"owner"},
                    {num:restaurants.length,                        lbl:"Restaurants",          icon:"🍽️",cls:"s-green", tag:"tag-green", tagTxt:"Listed",      tab:"restaurants",  filter:null},
                    {num:restaurants.filter(r=>r.isActive).length,  lbl:"Active Restaurants",   icon:"✅",cls:"s-blue",  tag:"tag-blue",  tagTxt:"Open",        tab:"restaurants",  filter:null},
                    {num:unassignedRestaurants.length,              lbl:"Unassigned Rests.",    icon:"🔓",cls:"s-yellow",tag:"tag-yellow",tagTxt:"No Owner",    tab:"restaurants",  filter:null},
                    {num:blockedUsers.length,                       lbl:"Blocked Users",        icon:"🚫",cls:"s-red",   tag:"tag-red",   tagTxt:"Blocked",     tab:"users",        filter:"all"},
                  ].map((s,i)=>(
                    <div className="ad-sc" key={i} style={{animationDelay:`${i*.06}s`,cursor:"pointer"}}
                      onClick={()=>{ setActiveTab(s.tab as ActiveTab); if(s.filter) setRoleFilter(s.filter as any); }}>
                      <div className="ad-sc-top"><div className={`ad-sc-ic ${s.cls}`} style={{fontSize:17}}>{s.icon}</div><span className={`ad-sc-tag ${s.tag}`}>{s.tagTxt}</span></div>
                      <div className="ad-sc-num">{s.num}</div>
                      <div className="ad-sc-lb">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* ✅ NEW: Unassigned Restaurants quick list */}
                {unassignedRestaurants.length > 0 && (
                  <div className="ad-card">
                    <div className="ad-card-hd">
                      <span className="ad-card-title">⚠️ Unassigned Restaurants</span>
                      <span className="ad-card-sub">Owner remove ho gaye — naya owner assign karo</span>
                    </div>
                    <table className="ad-table">
                      <thead><tr><th>Restaurant</th><th>City</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {unassignedRestaurants.map(r=>(
                          <tr key={r._id}>
                            <td><div className="ad-uc">{r.image?<img src={r.image} alt={r.name} className="ad-rest-img"/>:<div className="ad-rest-img-placeholder">🍽️</div>}<div><div className="ad-un">{r.name}</div><div className="ad-ue">{r.cuisineTypes?.slice(0,2).join(", ")}</div></div></div></td>
                            <td>{r.city}</td>
                            <td><span className="ad-status unassigned">⚠️ No Owner</span></td>
                            <td>
                              <button className="ad-btn primary" onClick={()=>{ setActiveTab("restaurants"); setTimeout(()=>handleEditClick(r),100); }}>
                                ✏️ Edit & Assign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="ad-card">
                  <div className="ad-card-hd"><span className="ad-card-title">Recent Restaurants</span><button className="ad-btn primary" onClick={()=>setActiveTab("restaurants")}>View All</button></div>
                  <table className="ad-table">
                    <thead><tr><th>Restaurant</th><th>City</th><th>Owner</th><th>Rating</th><th>Status</th></tr></thead>
                    <tbody>
                      {restaurants.slice(0,5).map(r=>{
                        const owner = users.find(u => {
                          const uid = typeof u.restaurant === "object" && u.restaurant ? (u.restaurant as any)._id : u.restaurant;
                          return uid === r._id;
                        });
                        return (
                          <tr key={r._id}>
                            <td><div className="ad-uc">{r.image?<img src={r.image} alt={r.name} className="ad-rest-img"/>:<div className="ad-rest-img-placeholder">🍽️</div>}<div><div className="ad-un">{r.name}</div><div className="ad-ue">{r.address}</div></div></div></td>
                            <td>{r.city}</td>
                            {/* ✅ Show owner name or "Unassigned" */}
                            <td>
                              {owner
                                ? <span style={{fontSize:11,color:"rgba(96,208,144,.8)"}}>{owner.name}</span>
                                : <span className="ad-status unassigned" style={{fontSize:10}}>No Owner</span>
                              }
                            </td>
                            <td style={{color:"#f0c060"}}>{r.rating>0?`${r.rating}★`:"—"}</td>
                            <td><span className={`ad-status ${r.isActive?"on":"off"}`}>{r.isActive?"Active":"Inactive"}</span></td>
                          </tr>
                        );
                      })}
                      {restaurants.length===0 && <tr><td colSpan={5} className="ad-empty">No restaurants yet</td></tr>}
                    </tbody>
                  </table>
                </div>

                <div className="ad-card">
                  <div className="ad-card-hd"><span className="ad-card-title">Recent Users</span><button className="ad-btn primary" onClick={()=>setActiveTab("users")}>View All</button></div>
                  <table className="ad-table">
                    <thead><tr><th>User</th><th>Role</th><th>Auth</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>
                      {users.slice(0,5).map(u=>(
                        <tr key={u._id}>
                          <td><div className="ad-uc"><div className="ad-av">{u.name.charAt(0).toUpperCase()}</div><div><div className="ad-un">{u.name}</div><div className="ad-ue">{u.email}</div></div></div></td>
                          <td><span className={`ad-rb ${u.role}`}><span className="ad-rd"/>{u.role}</span></td>
                          <td><span style={{fontSize:11,color:"rgba(180,140,255,.5)"}}>{u.isGoogleUser?"Google":"Email"}</span></td>
                          <td><span className={`ad-status ${u.isBlocked?"off":"on"}`}>{u.isBlocked?"Blocked":"Active"}</span></td>
                          <td style={{fontSize:11,color:"rgba(180,140,255,.4)"}}>{new Date(u.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ══ USERS ══ */}
            {activeTab==="users" && (
              <div className="ad-card">
                <div className="ad-card-hd">
                  <span className="ad-card-title">All Users</span>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div className="ad-filter-bar">
                      {(["all","user","owner","superadmin"] as const).map(r=>(
                        <button key={r} className={`ad-filter-pill${roleFilter===r?" active":""}`} onClick={()=>setRoleFilter(r)}>
                          {r==="all"?"All":r.charAt(0).toUpperCase()+r.slice(1)} ({r==="all"?users.length:users.filter(u=>u.role===r).length})
                        </button>
                      ))}
                    </div>
                    <div className="ad-search-wrap">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{color:"rgba(180,140,255,.4)",flexShrink:0}}><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      <input className="ad-search-in" placeholder="Search name or email..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
                    </div>
                    <span className="ad-card-sub">{filteredUsers.length} results</span>
                  </div>
                </div>
                {filteredUsers.length===0
                  ? <div className="ad-empty">No users found</div>
                  : <table className="ad-table">
                      <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Auth</th><th>Change Role</th><th>Assign Restaurant</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredUsers.map(u=>(
                          <UserRow key={u._id} u={u}
                            isMe={u.email===localStorage.getItem("email")}
                            roleLoading={roleLoading} assignLoading={assignLoading}
                            blockLoading={blockLoading} removeOwnerLoading={removeOwnerLoading}
                            onRoleChange={handleRoleChange} onAssignRestaurant={handleAssignRestaurant}
                            onDelete={(id,name)=>setConfirmDel({id,name})}
                            onBlock={handleBlockUser}
                            onViewDetail={setModalUser}
                            onRemoveOwner={(id,name)=>setConfirmRemoveOwner({id,name})}
                            restaurants={restaurants}
                          />
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            )}

            {/* ══ OWNER REQUESTS ══ */}
            {activeTab==="owner-requests" && (
              <div className="ad-card">
                <div className="ad-card-hd"><span className="ad-card-title">Owner Requests</span><span className="ad-card-sub">{ownerRequests.length} pending</span></div>
                {ownerRequests.length===0
                  ? <div className="ad-empty">🎉 No pending owner requests</div>
                  : <div style={{display:"flex",flexDirection:"column",gap:10,padding:20}}>
                      {ownerRequests.map(r=>(
                        <div className="ad-req-card" key={r._id} style={{flexDirection:"column",alignItems:"stretch",gap:14}}>
                          <div style={{display:"flex",alignItems:"center",gap:14}}>
                            <div className="ad-av" style={{width:44,height:44,fontSize:16,flexShrink:0}}>{r.name.charAt(0).toUpperCase()}</div>
                            <div style={{flex:1}}>
                              <div className="ad-un">{r.name}</div>
                              <div className="ad-ue">{r.email}</div>
                              <div style={{fontSize:10,color:"rgba(180,140,255,.35)",marginTop:2}}>
                                Applied {r.ownerApplication?.appliedAt ? new Date(r.ownerApplication.appliedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : new Date(r.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                              </div>
                            </div>
                            <div style={{display:"flex",gap:8,flexShrink:0}}>
                              <button className="ad-btn" disabled={reqLoading===r._id+"approve"} onClick={()=>handleOwnerRequest(r._id,"approve")} style={{background:"rgba(40,200,120,.14)",color:"#60d090",border:"1px solid rgba(40,200,120,.25)",padding:"7px 16px"}}>
                                {reqLoading===r._id+"approve"?<span className="ad-spinner"/>:"✓ Approve"}
                              </button>
                              <button className="ad-btn" disabled={reqLoading===r._id+"reject"} onClick={()=>handleOwnerRequest(r._id,"reject")} style={{background:"rgba(240,80,80,.12)",color:"#f07070",border:"1px solid rgba(240,80,80,.22)",padding:"7px 16px"}}>
                                {reqLoading===r._id+"reject"?<span className="ad-spinner"/>:"✗ Reject"}
                              </button>
                            </div>
                          </div>
                          {r.ownerApplication && (
                            <div style={{background:"rgba(160,96,240,.05)",border:"1px solid rgba(160,96,240,.1)",borderRadius:10,padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                              {[
                                ["🏪 Restaurant", r.ownerApplication.restaurantName],
                                ["📍 Location",   `${r.ownerApplication.city}, ${r.ownerApplication.state}`],
                                ["📞 Phone",      r.ownerApplication.phone],
                                ["🍽️ Type",       r.ownerApplication.restaurantType],
                                ["📋 FSSAI",      r.ownerApplication.fssaiNumber],
                                ["💎 Plan",       `${r.ownerApplication.subscriptionPlan} · ${r.ownerApplication.subscriptionDuration}`],
                                ["💰 Amount",     `₹${r.ownerApplication.subscriptionPrice?.toLocaleString()}`],
                                ["🪪 ID Proof",   r.ownerApplication.idProofType?.toUpperCase()],
                                ["🍛 Cuisines",   r.ownerApplication.cuisines?.slice(0,3).join(", ")],
                              ].map(([label, val]) => (
                                <div key={label as string}>
                                  <div style={{fontSize:9,color:"rgba(180,140,255,.4)",letterSpacing:".08em",marginBottom:2}}>{label}</div>
                                  <div style={{fontSize:11,color:"rgba(215,195,255,.75)",fontWeight:500}}>{val||"—"}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {r.ownerApplication && (r.ownerApplication.idProof || r.ownerApplication.restaurantPhoto) && (
                            <div style={{display:"flex",gap:10}}>
                              {r.ownerApplication.restaurantPhoto && (
                                <div>
                                  <div style={{fontSize:9,color:"rgba(180,140,255,.4)",letterSpacing:".08em",marginBottom:4}}>RESTAURANT PHOTO</div>
                                  <img src={r.ownerApplication.restaurantPhoto} alt="restaurant" style={{width:120,height:80,objectFit:"cover",borderRadius:8,border:"1px solid rgba(160,96,240,.2)"}}/>
                                </div>
                              )}
                              {r.ownerApplication.idProof && (
                                <div>
                                  <div style={{fontSize:9,color:"rgba(180,140,255,.4)",letterSpacing:".08em",marginBottom:4}}>ID PROOF ({r.ownerApplication.idProofType?.toUpperCase()})</div>
                                  <img src={r.ownerApplication.idProof} alt="id proof" style={{width:120,height:80,objectFit:"cover",borderRadius:8,border:"1px solid rgba(160,96,240,.2)"}}/>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ══ RESTAURANTS ══ */}
            {activeTab==="restaurants" && (
              <>
                {/* ✅ Alert for unassigned */}
                {unassignedRestaurants.length > 0 && (
                  <div className="ad-alert-banner">
                    <span style={{fontSize:20}}>⚠️</span>
                    <div className="ad-alert-banner-text">
                      <strong>{unassignedRestaurants.length} restaurant{unassignedRestaurants.length>1?"s":""}</strong> ke owner remove ho gaye — naya owner assign karo ya Users tab se karo.
                    </div>
                  </div>
                )}
                <div className="ad-card">
                  <div className="ad-card-hd">
                    <span className="ad-card-title">All Restaurants</span>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="ad-search-wrap">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{color:"rgba(180,140,255,.4)",flexShrink:0}}><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        <input className="ad-search-in" placeholder="Search restaurant or city..." value={restSearch} onChange={e=>setRestSearch(e.target.value)}/>
                      </div>
                      <span className="ad-card-sub">{restaurants.length} total · {restaurants.filter(r=>r.isActive).length} active · <span style={{color:"#fbbf24"}}>{unassignedRestaurants.length} unassigned</span></span>
                    </div>
                  </div>
                  {restaurants.length===0
                    ? <div className="ad-empty">No restaurants added yet</div>
                    : <table className="ad-table">
                        <thead><tr><th>Restaurant</th><th>City</th><th>Owner</th><th>Timing</th><th>Price</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {restaurants.filter(r=>r.name.toLowerCase().includes(restSearch.toLowerCase())||r.city.toLowerCase().includes(restSearch.toLowerCase())).map(r=>{
                            const owner = users.find(u => {
                              const uid = typeof u.restaurant === "object" && u.restaurant ? (u.restaurant as any)._id : u.restaurant;
                              return uid === r._id && u.role === "owner";
                            });
                            const isUnassigned = !r.addedBy && !owner;
                            return (
                              <tr key={r._id}>
                                <td><div className="ad-uc">{r.image?<img src={r.image} alt={r.name} className="ad-rest-img"/>:<div className="ad-rest-img-placeholder">🍽️</div>}<div><div className="ad-un">{r.name}</div><div className="ad-ue">{r.cuisineTypes.slice(0,2).join(", ")}</div></div></div></td>
                                <td>{r.city}</td>
                                {/* ✅ Owner column with "No Owner" badge */}
                                <td>
                                  {owner
                                    ? <div><div style={{fontSize:12,color:"rgba(96,208,144,.85)",fontWeight:500}}>{owner.name}</div><div style={{fontSize:10,color:"rgba(180,140,255,.35)"}}>{owner.email}</div></div>
                                    : <span className="ad-status unassigned">⚠️ No Owner</span>
                                  }
                                </td>
                                <td style={{fontSize:11,color:"rgba(180,140,255,.45)"}}>{r.openingTime||"—"} – {r.closingTime||"—"}</td>
                                <td><span className="ad-price-range">{r.priceRange}</span></td>
                                <td style={{color:"#f0c060"}}>{r.rating>0?`${r.rating}★`:"—"}</td>
                                <td>
                                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                    <span className={`ad-status ${r.isActive?"on":"off"}`}>{r.isActive?"Active":"Inactive"}</span>
                                    {isUnassigned && <span className="ad-status unassigned" style={{fontSize:9}}>No Owner</span>}
                                  </div>
                                </td>
                                <td>
                                  <div style={{display:"flex",gap:6}}>
                                    <button className="ad-btn primary" onClick={()=>toggleRestaurant(r._id)}>{r.isActive?"Deactivate":"Activate"}</button>
                                    <button className="ad-btn" title="Edit Restaurant" onClick={()=>handleEditClick(r)} style={{background:"rgba(60,140,240,.12)",color:"#70b0f0",border:"1px solid rgba(60,140,240,.2)"}}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button className="ad-btn" disabled={restDelLoading===r._id} onClick={()=>setConfirmRestDel({id:r._id,name:r.name})} style={{background:"rgba(240,80,80,.12)",color:"#f07070",border:"1px solid rgba(240,80,80,.2)"}}>
                                      {restDelLoading===r._id?<span className="ad-spinner"/>:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                  }
                </div>
                <div className="ad-card">
                  <div className="ad-card-hd" id="rest-form"><span className="ad-card-title">{editingRestId ? "✏️ Edit Restaurant" : "Add New Restaurant"}</span><div style={{display:"flex",alignItems:"center",gap:10}}>{imgUploading&&<div className="ad-uploading"><span className="ad-spinner"/>Uploading image...</div>}{editingRestId&&<button type="button" className="ad-btn" onClick={resetRestForm} style={{background:"rgba(240,80,80,.08)",color:"#f07070",border:"1px solid rgba(240,80,80,.18)"}}>✕ Cancel Edit</button>}</div></div>
                  <form className="ad-form" onSubmit={handleAddRestaurant}>
                    <div className="ad-field"><label className="ad-label">Restaurant Photo</label>
                      <div className="ad-img-wrap"><input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0]) handleImageUpload(e.target.files[0],"rest")}}/>
                        {restImgPreview?<img src={restImgPreview} alt="preview" className="ad-img-preview"/>:<div className="ad-img-placeholder"><div className="ad-img-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="rgba(160,96,240,.6)" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="rgba(160,96,240,.6)" strokeWidth="1.8"/><path d="m21 15-5-5L5 21" stroke="rgba(160,96,240,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="ad-img-txt">Click to upload photo<br/><span style={{fontSize:10,opacity:.6}}>JPG, PNG, WebP — max 5MB</span></div></div>}
                      </div>
                      {/* ✅ Image URL paste option */}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                        <span style={{fontSize:10,color:"rgba(180,140,255,.4)",whiteSpace:"nowrap"}}>Or paste URL:</span>
                        <input className="ad-input" style={{fontSize:11,padding:"6px 10px"}} placeholder="https://images.unsplash.com/..." value={restForm.image}
                          onChange={e=>{ setRestForm(p=>({...p,image:e.target.value})); setRestImgPreview(e.target.value); }}/>
                      </div>
                    </div>
                    <div className="ad-form-grid">
                      <div className="ad-field"><label className="ad-label">Restaurant Name *</label><input className="ad-input" placeholder="e.g. The Grand Spice" value={restForm.name} onChange={e=>setRestForm(p=>({...p,name:e.target.value}))} required/></div>
                      <div className="ad-field"><label className="ad-label">City *</label><input className="ad-input" placeholder="e.g. Mumbai" value={restForm.city} onChange={e=>setRestForm(p=>({...p,city:e.target.value}))} required/></div>
                    </div>
                    <div className="ad-field"><label className="ad-label">Address *</label><input className="ad-input" placeholder="Street address, landmark" value={restForm.address} onChange={e=>setRestForm(p=>({...p,address:e.target.value}))} required/></div>
                    <div className="ad-field"><label className="ad-label">Description</label><textarea className="ad-textarea" placeholder="Short description..." value={restForm.description} onChange={e=>setRestForm(p=>({...p,description:e.target.value}))}/></div>
                    <div className="ad-form-grid3">
                      <div className="ad-field"><label className="ad-label">Phone Number</label><input className="ad-input" placeholder="+91 98765 43210" value={restForm.phoneNumber} onChange={e=>setRestForm(p=>({...p,phoneNumber:e.target.value}))}/></div>
                      <div className="ad-field"><label className="ad-label">Manager Contact</label><input className="ad-input" placeholder="Manager phone" value={restForm.managerContact} onChange={e=>setRestForm(p=>({...p,managerContact:e.target.value}))}/></div>
                      <div className="ad-field"><label className="ad-label">Tel Number</label><input className="ad-input" placeholder="Landline" value={restForm.telNumber} onChange={e=>setRestForm(p=>({...p,telNumber:e.target.value}))}/></div>
                    </div>
                    <div className="ad-form-grid" style={{gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
                      <div className="ad-field"><label className="ad-label">Opening Time</label><input className="ad-input" type="time" value={restForm.openingTime} onChange={e=>setRestForm(p=>({...p,openingTime:e.target.value}))}/></div>
                      <div className="ad-field"><label className="ad-label">Closing Time</label><input className="ad-input" type="time" value={restForm.closingTime} onChange={e=>setRestForm(p=>({...p,closingTime:e.target.value}))}/></div>
                      <div className="ad-field"><label className="ad-label">Price Range</label><select className="ad-select" value={restForm.priceRange} onChange={e=>setRestForm(p=>({...p,priceRange:e.target.value}))}><option value="₹">₹ Budget</option><option value="₹₹">₹₹ Mid-range</option><option value="₹₹₹">₹₹₹ Fine Dining</option></select></div>
                      <div className="ad-field"><label className="ad-label">Rating (0-5)</label><input className="ad-input" type="number" min="0" max="5" step="0.1" placeholder="4.5" value={restForm.rating} onChange={e=>setRestForm(p=>({...p,rating:e.target.value}))}/></div>
                    </div>
                    <div className="ad-field"><label className="ad-label">Cuisine Types</label>
                      <div className="ad-cuisine-grid">{CUISINES.map(c=><button key={c} type="button" className={`ad-cuisine-tag${restForm.cuisineTypes.includes(c)?" sel":""}`} onClick={()=>setRestForm(p=>({...p,cuisineTypes:p.cuisineTypes.includes(c)?p.cuisineTypes.filter(x=>x!==c):[...p.cuisineTypes,c]}))}>{c}</button>)}</div>
                    </div>
                    <div style={{display:"flex",justifyContent:"flex-end"}}><button className="ad-submit" type="submit" disabled={restSubmitting||imgUploading}>{restSubmitting?<><span className="ad-spinner"/>{editingRestId?" Updating...":" Adding..."}</> :editingRestId?"✓ Update Restaurant":"+ Add Restaurant"}</button></div>
                  </form>
                </div>
              </>
            )}

            {/* ══ FOOD ITEMS ══ */}
            {activeTab==="food" && (
              <>
                <div className="ad-card">
                  <div className="ad-card-hd" id="food-form"><span className="ad-card-title">{editingFoodId?"✏️ Edit Food Item":"Add Food Item"}</span><div style={{display:"flex",alignItems:"center",gap:10}}>{imgUploading&&<div className="ad-uploading"><span className="ad-spinner"/>Uploading image...</div>}{editingFoodId&&<button type="button" className="ad-btn" onClick={resetFoodForm} style={{background:"rgba(240,80,80,.08)",color:"#f07070",border:"1px solid rgba(240,80,80,.18)"}}>✕ Cancel Edit</button>}</div></div>
                  <form className="ad-form" onSubmit={handleAddFoodItem}>
                    <div className="ad-field"><label className="ad-label">Select Restaurant *</label>
                      <select className="ad-select" value={foodForm.restaurant} onChange={e=>{setFoodForm(p=>({...p,restaurant:e.target.value}));fetchFoodItems(e.target.value);}}>
                        <option value="">-- Choose Restaurant --</option>
                        {restaurants.map(r=><option key={r._id} value={r._id}>{r.name} — {r.city}</option>)}
                      </select>
                    </div>
                    <div className="ad-form-grid">
                      <div className="ad-field"><label className="ad-label">Food Photo</label>
                        <div className="ad-img-wrap" style={{height:110}}><input type="file" accept="image/*" onChange={e=>{if(e.target.files?.[0]) handleImageUpload(e.target.files[0],"food")}}/>
                          {foodImgPreview?<img src={foodImgPreview} alt="preview" className="ad-img-preview"/>:<div className="ad-img-placeholder"><div className="ad-img-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="rgba(160,96,240,.6)" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="rgba(160,96,240,.6)" strokeWidth="1.8"/><path d="m21 15-5-5L5 21" stroke="rgba(160,96,240,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="ad-img-txt" style={{fontSize:10}}>Upload photo</div></div>}
                        </div>
                        {/* ✅ Image URL paste option for food */}
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                          <span style={{fontSize:10,color:"rgba(180,140,255,.4)",whiteSpace:"nowrap"}}>Or paste URL:</span>
                          <input className="ad-input" style={{fontSize:11,padding:"6px 10px"}} placeholder="https://images.unsplash.com/..." value={foodForm.image}
                            onChange={e=>{ setFoodForm(p=>({...p,image:e.target.value})); setFoodImgPreview(e.target.value); }}/>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:12}}>
                        <div className="ad-field"><label className="ad-label">Item Name *</label><input className="ad-input" placeholder="e.g. Butter Chicken" value={foodForm.name} onChange={e=>setFoodForm(p=>({...p,name:e.target.value}))} required/></div>
                        <div className="ad-field"><label className="ad-label">Description</label><textarea className="ad-textarea" style={{minHeight:60}} placeholder="Short description..." value={foodForm.description} onChange={e=>setFoodForm(p=>({...p,description:e.target.value}))}/></div>
                      </div>
                    </div>
                    <div className="ad-form-grid" style={{gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
                      <div className="ad-field"><label className="ad-label">Price (₹) *</label><input className="ad-input" type="number" min="0" placeholder="299" value={foodForm.price} onChange={e=>setFoodForm(p=>({...p,price:e.target.value}))} required/></div>
                      <div className="ad-field"><label className="ad-label">Offer (%)</label><input className="ad-input" type="number" min="0" max="100" placeholder="0" value={foodForm.offer} onChange={e=>setFoodForm(p=>({...p,offer:e.target.value}))}/></div>
                      <div className="ad-field"><label className="ad-label">Category</label><select className="ad-select" value={foodForm.category} onChange={e=>setFoodForm(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                      <div className="ad-field"><label className="ad-label">Spicy Level</label><select className="ad-select" value={foodForm.spicyLevel} onChange={e=>setFoodForm(p=>({...p,spicyLevel:e.target.value}))}>{SPICY_LEVELS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                    </div>
                    <div className="ad-form-grid">
                      <div className="ad-field"><label className="ad-label">Food Type</label><div className="ad-veg-row"><button type="button" className={`ad-veg-pill veg${foodForm.isVeg?" sel":""}`} onClick={()=>setFoodForm(p=>({...p,isVeg:true}))}>🟢 Veg</button><button type="button" className={`ad-veg-pill nonveg${!foodForm.isVeg?" sel":""}`} onClick={()=>setFoodForm(p=>({...p,isVeg:false}))}>🔴 Non-Veg</button></div></div>
                      <div className="ad-field"><label className="ad-label">Availability</label><div className="ad-toggle-wrap" style={{marginTop:6}}><button type="button" className={`ad-toggle ${foodForm.isAvailable?"on":"off"}`} onClick={()=>setFoodForm(p=>({...p,isAvailable:!p.isAvailable}))}><div className="ad-toggle-knob"/></button><span className="ad-toggle-lb">{foodForm.isAvailable?"Available":"Not Available"}</span></div></div>
                    </div>
                    <div style={{display:"flex",justifyContent:"flex-end"}}><button className="ad-submit" type="submit" disabled={foodSubmitting||imgUploading}>{foodSubmitting?<><span className="ad-spinner"/>{editingFoodId?" Updating...":" Adding..."}</>:editingFoodId?"✓ Update Food Item":"+ Add Food Item"}</button></div>
                  </form>
                </div>
                {foodItems.length>0 && (
                  <div className="ad-card">
                    <div className="ad-card-hd"><span className="ad-card-title">Food Items</span><span className="ad-card-sub">{foodItems.length} items</span></div>
                    <table className="ad-table">
                      <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Offer</th><th>Type</th><th>Spicy</th><th>Available</th></tr></thead>
                      <tbody>
                        {foodItems.map(f=>(
                          <tr key={f._id}>
                            <td><div className="ad-uc">{f.image?<img src={f.image} alt={f.name} className="ad-rest-img"/>:<div className="ad-rest-img-placeholder" style={{fontSize:16}}>🍱</div>}<div><div className="ad-un">{f.name}</div><div className="ad-ue">{f.description?.slice(0,40)}{f.description?.length>40?"...":""}</div></div></div></td>
                            <td style={{fontSize:11,color:"rgba(180,140,255,.5)"}}>{f.category}</td>
                            <td style={{color:"#c090ff",fontFamily:"'Cinzel',serif"}}>₹{f.price}</td>
                            <td>{f.offer>0?<span style={{color:"#60d090",fontSize:11}}>{f.offer}% off</span>:<span style={{color:"rgba(180,140,255,.3)"}}>—</span>}</td>
                            <td style={{fontSize:11}}>{f.isVeg?"🟢 Veg":"🔴 Non-Veg"}</td>
                            <td style={{fontSize:11,color:"rgba(180,140,255,.5)"}}>{f.spicyLevel}</td>
                            <td>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <button className={`ad-status ${f.isAvailable?"on":"off"}`} style={{border:"none",cursor:"pointer",background:"transparent"}} onClick={()=>toggleFood(f._id)}>{f.isAvailable?"Available":"Unavailable"}</button>
                                <button className="ad-btn" title="Edit" onClick={()=>handleFoodEditClick(f)} style={{background:"rgba(60,140,240,.12)",color:"#70b0f0",border:"1px solid rgba(60,140,240,.2)"}}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button className="ad-btn" title="Delete" onClick={()=>handleDeleteFoodItem(f._id)} style={{background:"rgba(240,80,80,.12)",color:"#f07070",border:"1px solid rgba(240,80,80,.2)"}}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ══ BOOKINGS / ORDERS ══ */}
            {(activeTab==="bookings"||activeTab==="orders") && (
              <div className="ad-card">
                <div className="ad-card-hd"><span className="ad-card-title">{activeTab==="bookings"?"Bookings Management":"Orders Management"}</span></div>
                <div style={{padding:"56px 32px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                  <div style={{width:52,height:52,borderRadius:14,background:"rgba(160,96,240,.1)",border:"1px solid rgba(160,96,240,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{activeTab==="bookings"?"📅":"📦"}</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:14,color:"rgba(200,165,255,.55)",letterSpacing:".08em"}}>Coming Soon</div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {modalUser && <UserModal u={modalUser} onClose={()=>setModalUser(null)}/>}
      {confirmDel && <ConfirmModal msg={`"${confirmDel.name}" ko permanently delete karna chahte ho? Uska restaurant unassigned ho jayega.`} onConfirm={()=>handleDeleteUser(confirmDel.id)} onCancel={()=>setConfirmDel(null)}/>}
      {confirmRestDel && <ConfirmModal msg={`"${confirmRestDel.name}" restaurant delete karna chahte ho? Saare food items bhi delete ho jayenge.`} onConfirm={()=>handleDeleteRestaurant(confirmRestDel.id)} onCancel={()=>setConfirmRestDel(null)}/>}
      {/* ✅ NEW: Remove Owner confirm modal */}
      {confirmRemoveOwner && <ConfirmModal
        msg={`"${confirmRemoveOwner.name}" ko owner se remove karna chahte ho? Unhe "user" role milega aur unka restaurant unassigned ho jayega. Naya owner assign kar sakte ho baad mein.`}
        onConfirm={()=>handleRemoveOwner(confirmRemoveOwner.id)}
        onCancel={()=>setConfirmRemoveOwner(null)}
        danger={false}
      />}
      {toast && <div className={`ad-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}