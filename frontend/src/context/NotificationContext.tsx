import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  bookingId?: string;
  restaurant?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoggedIn } = useAuth();

  // Persist notifications in localStorage per user
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`tt_notifs_${user?.id || "guest"}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const socketRef = useRef<Socket | null>(null);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`tt_notifs_${user?.id || "guest"}`, JSON.stringify(notifications.slice(0, 50)));
    } catch { /* ignore quota errors */ }
  }, [notifications, user?.id]);

  // Reload saved notifications when user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tt_notifs_${user?.id || "guest"}`);
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch { setNotifications([]); }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const joinRoom = () => socket.emit("join", user.id);

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    socket.on("notification", (payload: Omit<AppNotification, "id" | "read">) => {
      const notif: AppNotification = {
        ...payload,
        id:   Date.now().toString(36) + Math.random().toString(36).slice(2),
        read: false,
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);

  const markRead = useCallback((id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};

// ── Bell Icon Component (use inside Navbar) ───────────────────────────────────
export function NotificationBell({ theme }: { theme: "dark" | "light" }) {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);

  const openPanel = () => {
    if (bellBtnRef.current) {
      const rect = bellBtnRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  // Reposition panel on scroll/resize
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (bellBtnRef.current) {
        const rect = bellBtnRef.current.getBoundingClientRect();
        setPanelPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeColors = {
    success: "#10b981",
    error:   "#ef4444",
    info:    "#3b82f6",
    warning: "#f59e0b",
  };

  const typeIcons = {
    success: "✅",
    error:   "❌",
    info:    "🔔",
    warning: "⚠️",
  };

  const isDark = theme === "dark";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <style>{`
        @keyframes nb-bell-shake {
          0%,100%{transform:rotate(0)} 20%{transform:rotate(-12deg)} 40%{transform:rotate(12deg)}
          60%{transform:rotate(-8deg)} 80%{transform:rotate(8deg)}
        }
        @keyframes nb-notif-in {
          from{opacity:0;transform:translateY(-8px) scale(0.96)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        .nb-bell-btn {
          position: relative;
          width: 38px; height: 38px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
          background: ${isDark ? "rgba(160,100,255,0.08)" : "rgba(37,99,235,0.06)"};
        }
        .nb-bell-btn:hover {
          background: ${isDark ? "rgba(160,100,255,0.15)" : "rgba(37,99,235,0.12)"};
        }
        .nb-bell-btn.has-unread svg {
          animation: nb-bell-shake 0.6s ease;
        }
        .nb-bell-badge {
          position: absolute;
          top: 4px; right: 4px;
          min-width: 16px; height: 16px;
          border-radius: 8px;
          background: #ef4444;
          color: #fff;
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          border: 2px solid ${isDark ? "#08040f" : "#ffffff"};
        }
        .nb-notif-panel {
          position: fixed;
          width: 340px;
          max-height: 480px;
          border-radius: 16px;
          overflow: hidden;
          display: flex; flex-direction: column;
          animation: nb-notif-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
          z-index: 999999;
          ${isDark
            ? "background:rgba(10,6,24,0.98);border:1px solid rgba(160,96,240,0.18);box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(160,96,240,0.08);backdrop-filter:blur(40px);"
            : "background:rgba(255,255,255,0.98);border:1px solid rgba(226,232,240,0.8);box-shadow:0 10px 40px rgba(0,0,0,0.12);"}
        }
        .nb-notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid ${isDark ? "rgba(160,96,240,0.1)" : "#f1f5f9"};
        }
        .nb-notif-title {
          font-size: 13px; font-weight: 700;
          color: ${isDark ? "rgba(220,190,255,0.9)" : "#1e293b"};
          font-family: 'Montserrat', sans-serif;
        }
        .nb-notif-actions {
          display: flex; gap: 8px;
        }
        .nb-notif-action-btn {
          font-size: 10px; font-weight: 600;
          background: none; border: none; cursor: pointer;
          padding: 3px 8px; border-radius: 5px;
          font-family: 'Montserrat', sans-serif;
          color: ${isDark ? "rgba(160,100,255,0.7)" : "#7c3aed"};
          transition: background 0.15s;
        }
        .nb-notif-action-btn:hover {
          background: ${isDark ? "rgba(160,96,240,0.12)" : "#f5f3ff"};
        }
        .nb-notif-list {
          overflow-y: auto; flex: 1;
        }
        .nb-notif-list::-webkit-scrollbar { width: 4px; }
        .nb-notif-list::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(160,96,240,0.25)" : "#e2e8f0"}; border-radius: 4px; }
        .nb-notif-item {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#f8fafc"};
          transition: background 0.15s;
        }
        .nb-notif-item:hover {
          background: ${isDark ? "rgba(160,96,240,0.07)" : "#f8fafc"};
        }
        .nb-notif-item.unread {
          background: ${isDark ? "rgba(160,96,240,0.06)" : "rgba(37,99,235,0.03)"};
        }
        .nb-notif-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #ef4444;
          flex-shrink: 0;
          margin-top: 5px;
        }
        .nb-notif-dot.read { background: transparent; }
        .nb-notif-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .nb-notif-body { flex: 1; min-width: 0; }
        .nb-notif-item-title {
          font-size: 12px; font-weight: 600;
          color: ${isDark ? "rgba(220,190,255,0.9)" : "#1e293b"};
          font-family: 'Montserrat', sans-serif;
          margin-bottom: 2px;
        }
        .nb-notif-item-msg {
          font-size: 11px;
          color: ${isDark ? "rgba(180,155,255,0.45)" : "#64748b"};
          line-height: 1.4;
        }
        .nb-notif-time {
          font-size: 10px;
          color: ${isDark ? "rgba(180,155,255,0.3)" : "#94a3b8"};
          margin-top: 3px;
        }
        .nb-notif-empty {
          padding: 40px 20px;
          text-align: center;
          font-size: 13px;
          color: ${isDark ? "rgba(180,155,255,0.3)" : "#94a3b8"};
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>

      <button
        ref={bellBtnRef}
        className={`nb-bell-btn${unreadCount > 0 ? " has-unread" : ""}`}
        onClick={openPanel}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={isDark ? "rgba(200,170,255,0.7)" : "#64748b"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="nb-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          className="nb-notif-panel"
          style={{
            top: panelPos.top,
            right: panelPos.right,
          }}
        >
          <div className="nb-notif-header">
            <span className="nb-notif-title">Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            <div className="nb-notif-actions">
              {unreadCount > 0 && (
                <button className="nb-notif-action-btn" onClick={markAllRead}>Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button className="nb-notif-action-btn" onClick={clearAll}>Clear all</button>
              )}
            </div>
          </div>

          <div className="nb-notif-list">
            {notifications.length === 0 ? (
              <div className="nb-notif-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`nb-notif-item${!n.read ? " unread" : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`nb-notif-dot${n.read ? " read" : ""}`} />
                  <div className="nb-notif-icon">{typeIcons[n.type]}</div>
                  <div className="nb-notif-body">
                    <div className="nb-notif-item-title" style={{ color: typeColors[n.type] }}>
                      {n.title}
                    </div>
                    <div className="nb-notif-item-msg">{n.message}</div>
                    {n.restaurant && (
                      <div className="nb-notif-item-msg" style={{ marginTop: 2 }}>
                        📍 {n.restaurant}
                      </div>
                    )}
                    <div className="nb-notif-time">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}