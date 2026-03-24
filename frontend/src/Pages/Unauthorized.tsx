import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fef2f2",
            border: "2px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Access Denied
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
          You don't have permission to view this page.
          {role && (
            <>
              {" "}Your current role is{" "}
              <span
                style={{
                  fontWeight: 600,
                  color: "#1a1f2e",
                  background: "#f3f4f6",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {role}
              </span>
            </>
          )}
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            width: "100%",
            padding: "12px",
            background: "#1a1f2e",
            color: "#ffffff",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 10,
          }}
        >
          Go to Dashboard
        </button>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          style={{
            width: "100%",
            padding: "11px",
            background: "transparent",
            color: "#6b7280",
            border: "1.5px solid #e5e7eb",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}