import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { loadUserProfile } from "../services/userService.js";

export default function HomePage() {
  const { currentUser } = useAuth();
  const [domain, setDomain] = useState("both");
  const name =
    currentUser.displayName?.split(" ")[0] ||
    currentUser.email?.split("@")[0] ||
    "אלוף";

  useEffect(() => {
    loadUserProfile(currentUser.uid)
      .then((profile) => setDomain(profile.startDomain || "both"))
      .catch(() => setDomain("both"));
  }, [currentUser.uid]);

  const canStudy = domain === "english" || domain === "both";
  const canFitness = domain === "fitness" || domain === "both";

  return (
    <div>
      <section className="hero">
        <div>
          <em>ברוך הבא למתקדמים</em>
          <h1>שלום, {name} 👋</h1>
          <p>בוחרים מסלול וממשיכים בדיוק מהמקום שבו עצרת.</p>
        </div>
        <div className="orbit">⭐<b>מתקדמים</b></div>
      </section>

      <section className="home-grid">
        {canStudy && (
          <Link className="home-card blue" to="/study">
            <span>📘</span><h2>לימודים</h2>
            <p>אנגלית, מתמטיקה, לשון והבנת הנקרא.</p><b>מתחילים ←</b>
          </Link>
        )}

        {canFitness && (
          <Link className="home-card green" to="/fitness">
            <span>💪</span><h2>כושר אישי</h2>
            <p>תוכנית מותאמת, דרגות ו־3 אימונים בשבוע.</p><b>מתאמנים ←</b>
          </Link>
        )}

        <Link className="home-card progress-color" to="/progress">
          <span>📈</span><h2>התקדמות</h2>
          <p>רואים איך התקדמת בלימודים ובכושר.</p><b>לנתונים ←</b>
        </Link>

        <Link className="home-card purple" to="/games">
          <span>🎮</span><h2>משחקים</h2>
          <p>משחקי אנגלית, חשבון ואתגר.</p><b>משחקים ←</b>
        </Link>

        <Link className="home-card gold" to="/rewards">
          <span>🛍️</span><h2>חנות הפרסים</h2>
          <p>קונים פרסים בעזרת המטבעות.</p><b>לחנות ←</b>
        </Link>

        <Link className="home-card collection-color" to="/reward-room">
          <span>🎁</span><h2>חדר הפרסים</h2>
          <p>כל הפרסים, התגים והפריטים שקנית.</p><b>לחדר ←</b>
        </Link>
      </section>
    </div>
  );
}
