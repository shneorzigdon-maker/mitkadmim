import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  loadUserProfile,
  saveUserProfile,
} from "../services/userService.js";
import { Loading } from "../components/Layout.jsx";

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: currentUser.displayName || "",
    age: "",
    city: "",
    startDomain: "both",
  });

  useEffect(() => {
    let active = true;

    loadUserProfile(currentUser.uid)
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm({
          displayName: data.displayName || currentUser.displayName || "",
          age: data.age || "",
          city: data.city || "",
          startDomain: data.startDomain || "both",
        });
      })
      .catch(() => {
        if (active) setError("לא הצלחנו לטעון את הפרופיל.");
      });

    return () => {
      active = false;
    };
  }, [currentUser.uid, currentUser.displayName]);

  async function save(event) {
    event.preventDefault();
    await saveUserProfile(currentUser.uid, form);
    setProfile((current) => ({ ...current, ...form }));
    setEditing(false);
  }

  if (error) {
    return (
      <section className="profile-error">
        <span>⚠️</span><h2>{error}</h2>
        <button className="primary" onClick={() => window.location.reload()}>
          נסה שוב
        </button>
      </section>
    );
  }

  if (!profile) return <Loading text="טוענים פרופיל..." />;

  return (
    <div className="profile">
      <section>
        <div className="avatar">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="" />
          ) : (
            <span>
              {(profile.displayName || currentUser.email || "מ")
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <em>הפרופיל שלי</em>
          <h1>{profile.displayName || "משתמש מתקדמים"}</h1>
          <p>{currentUser.email}</p>
          <button className="secondary profile-edit-button" onClick={() => setEditing(true)}>
            עריכת פרטים
          </button>
        </div>
      </section>

      {editing && (
        <form className="profile-form" onSubmit={save}>
          <label>שם<input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label>
          <label>גיל<input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
          <label>עיר<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label>המסלול הראשי
            <select value={form.startDomain} onChange={(e) => setForm({ ...form, startDomain: e.target.value })}>
              <option value="english">לימודים בלבד</option>
              <option value="fitness">כושר בלבד</option>
              <option value="both">גם וגם</option>
            </select>
          </label>
          <div><button className="primary">שמירה</button><button type="button" className="secondary" onClick={() => setEditing(false)}>ביטול</button></div>
        </form>
      )}

      <div className="profile-stats">
        {[
          ["רמה", profile.level ?? 1],
          ["XP", profile.xp ?? 0],
          ["מטבעות", profile.coins ?? 0],
          ["לימודים", profile.completedLessons ?? 0],
          ["אימונים", profile.completedWorkouts ?? 0],
          ["משחקים", profile.completedGames ?? 0],
        ].map(([key, value]) => (
          <article key={key}><small>{key}</small><b>{value}</b></article>
        ))}
      </div>

      <section className="profile-info">
        <article><small>גיל</small><b>{profile.age || "לא הוגדר"}</b></article>
        <article><small>עיר</small><b>{profile.city || "לא הוגדרה"}</b></article>
        <article><small>מסלולי לימוד</small><b>{profile.selectedLearningTracks?.length || 0}</b></article>
        <article><small>ימי כושר</small><b>{profile.fitnessProfile?.days?.join(", ") || "טרם נבחרו"}</b></article>
      </section>
    </div>
  );
}
