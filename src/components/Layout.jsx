import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ADMIN_EMAIL,
  loadUserProfile,
} from "../services/userService.js";

export function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="logo">מ</span>
      <span>
        <b>מתקדמים</b>
        {!compact && <small>לומדים. מתקדמים. מצליחים.</small>}
      </span>
    </div>
  );
}

export function Loading({ text = "טוענים..." }) {
  return (
    <div className="loading">
      <span className="logo">מ</span>
      <i />
      <p>{text}</p>
    </div>
  );
}

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const [domain, setDomain] = useState("both");
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    loadUserProfile(currentUser.uid)
      .then((profile) => setDomain(profile.startDomain || "both"))
      .catch(() => setDomain("both"));
  }, [currentUser.uid]);

  const canStudy = domain === "english" || domain === "both";
  const canFitness = domain === "fitness" || domain === "both";

  const items = [
    ["/", "🏠", "בית", true],
    ["/study", "📘", "לימודים", canStudy],
    ["/fitness", "💪", "כושר", canFitness],
    ["/progress", "📈", "התקדמות", true],
    ["/games", "🎮", "משחקים", true],
    ["/rewards", "🛍️", "חנות", true],
    ["/reward-room", "🎁", "חדר פרסים", true],
    ["/profile", "👤", "פרופיל", true],
  ].filter((item) => item[3]);

  return (
    <div className="shell">
      <header>
        <Link to="/"><Brand compact /></Link>

        <div className="header-actions">
          {isAdmin && <Link className="admin-link" to="/admin">חדר בקרה</Link>}

          <Link className="user-chip" to="/profile">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="" />
            ) : (
              <span>
                {(currentUser.displayName || currentUser.email || "מ")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
            <b>{currentUser.displayName || "הפרופיל שלי"}</b>
          </Link>

          <button onClick={logout}>יציאה</button>
        </div>
      </header>

      <main><Outlet /></main>

      <nav style={{ "--nav-count": items.length }}>
        {items.map(([to, icon, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>{icon}</span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
