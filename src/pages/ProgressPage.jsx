import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { loadUserProfile } from "../services/userService.js";
import { Loading } from "../components/Layout.jsx";

function ProgressBar({ label, value, color }) {
  const safe = Math.min(100, Math.max(0, Number(value || 0)));

  return (
    <article className="progress-item">
      <div><b>{label}</b><span>{safe}%</span></div>
      <div className="progress-track">
        <span style={{ width: `${safe}%`, background: color }} />
      </div>
    </article>
  );
}

export default function ProgressPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserProfile(currentUser.uid)
      .then(setProfile)
      .catch(() => setError("לא הצלחנו לטעון את נתוני ההתקדמות."));
  }, [currentUser.uid]);

  if (error) return <div className="message">{error}</div>;
  if (!profile) return <Loading text="טוענים התקדמות..." />;

  const overall = Math.round(
    (
      Number(profile.englishProgress || 0) +
      Number(profile.mathProgress || 0) +
      Number(profile.languageProgress || 0) +
      Number(profile.fitnessProgress || 0)
    ) / 4
  );

  return (
    <div className="content-page">
      <section className="page-title progress-title">
        <span>📈</span>
        <div>
          <em>התקדמות אישית</em>
          <h1>רואים כמה התקדמת</h1>
          <p>לימודים, כושר, XP, מטבעות ופעילויות.</p>
        </div>
      </section>

      <section className="progress-overview">
        <div className="progress-circle" style={{ "--progress": `${overall * 3.6}deg` }}>
          <span><b>{overall}%</b><small>התקדמות כללית</small></span>
        </div>

        <div className="progress-stat-grid">
          <article><span>⭐</span><b>{profile.xp || 0}</b><small>XP</small></article>
          <article><span>🪙</span><b>{profile.coins || 0}</b><small>מטבעות</small></article>
          <article><span>📚</span><b>{profile.completedLessons || 0}</b><small>שיעורים</small></article>
          <article><span>💪</span><b>{profile.completedWorkouts || 0}</b><small>אימונים</small></article>
        </div>
      </section>

      <section className="progress-list">
        <ProgressBar label="אנגלית" value={profile.englishProgress} color="#4f7cf3" />
        <ProgressBar label="חשבון ומתמטיקה" value={profile.mathProgress} color="#8a5de7" />
        <ProgressBar label="לשון והבנת הנקרא" value={profile.languageProgress} color="#e28d32" />
        <ProgressBar label="כושר" value={profile.fitnessProgress} color="#2bac7d" />
      </section>

      <section className="weekly-goals">
        <h2>יעדים שבועיים</h2>
        <div>
          <article><span>📘</span><b>{Math.min(profile.completedLessons || 0, 5)}/5</b><small>שיעורים</small></article>
          <article><span>💪</span><b>{Math.min(profile.completedWorkouts || 0, 3)}/3</b><small>אימונים</small></article>
          <article><span>🎮</span><b>{Math.min(profile.completedGames || 0, 3)}/3</b><small>משחקים</small></article>
        </div>
      </section>
    </div>
  );
}
