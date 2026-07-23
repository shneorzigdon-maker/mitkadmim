import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { saveStartDomain } from "../services/userService.js";

const OPTIONS = [
  {
    id: "english",
    icon: "🇬🇧",
    title: "אנגלית ולימודים",
    text: "אנגלית, חשבון, מתמטיקה, לשון והבנת הנקרא",
    action: "בחירת לימודים",
  },
  {
    id: "fitness",
    icon: "💪",
    title: "כושר",
    text: "אימונים מותאמים, דרגות ומעקב התקדמות",
    action: "בחירת כושר",
  },
  {
    id: "both",
    icon: "🚀",
    title: "גם וגם",
    text: "לומדים, מתאמנים ומתקדמים בשני המסלולים",
    action: "בחירת שני המסלולים",
  },
];

export default function OnboardingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");

  async function choose(value) {
    setBusy(value);
    await saveStartDomain(currentUser.uid, value);
    navigate("/", { replace: true });
  }

  return (
    <div className="entry-page">
      <div className="entry-card">
        <div className="entry-brand">
          <span className="logo">מ</span>
          <div><b>מתקדמים</b><small>לומדים. מתקדמים. מצליחים.</small></div>
        </div>

        <em>הגדרה ראשונית</em>
        <h1>במה רוצים להתקדם?</h1>
        <p>הבחירה קובעת אילו מסלולים יופיעו. אפשר לשנות אותה בהמשך בפרופיל.</p>

        <div className="entry-options">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              className={option.id === "both" ? "both" : option.id}
              disabled={Boolean(busy)}
              onClick={() => choose(option.id)}
            >
              <span>{option.icon}</span>
              <div>
                <h2>{option.title}</h2>
                <p>{option.text}</p>
                <b>{busy === option.id ? "שומרים..." : `${option.action} ←`}</b>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
