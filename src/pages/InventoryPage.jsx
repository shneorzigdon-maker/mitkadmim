import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { loadUserProfile } from "../services/userService.js";
import { Loading } from "../components/Layout.jsx";

const REWARDS = {
  "lion-avatar": { icon: "🦁", title: "אווטאר אריה", type: "אווטאר" },
  "crown-badge": { icon: "👑", title: "תג מלך", type: "תג" },
  "forest-theme": { icon: "🌲", title: "רקע יער", type: "רקע" },
  "gold-star": { icon: "🌟", title: "כוכב זהב", type: "תג" },
  "champion-cup": { icon: "🏆", title: "גביע אלוף", type: "גביע" },
  "secret-game": { icon: "🕹️", title: "משחק סודי", type: "משחק" },
};

export default function InventoryPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadUserProfile(currentUser.uid).then(setProfile).catch(() => setProfile({ ownedRewards: [] }));
  }, [currentUser.uid]);

  if (!profile) return <Loading text="טוענים את חדר הפרסים..." />;

  const owned = profile.ownedRewards || [];

  return (
    <div className="content-page">
      <section className="page-title inventory-title">
        <span>🎒</span>
        <div>
          <em>חדר הפרסים</em>
          <h1>החדר שאליו נכנסים כל הפרסים שקנית</h1>
          <p>אווטארים, תגים, גביעים, רקעים ומשחקים.</p>
        </div>
      </section>

      {owned.length === 0 ? (
        <section className="empty-inventory">
          <span>🎁</span>
          <h2>עדיין אין פרסים באוסף</h2>
          <p>צבור מטבעות וקנה פרסים בחנות.</p>
        </section>
      ) : (
        <section className="inventory-grid">
          {owned.map((id) => {
            const reward = REWARDS[id] || { icon: "🎁", title: id, type: "פרס" };
            return (
              <article key={id}>
                <span>{reward.icon}</span>
                <h3>{reward.title}</h3>
                <p>{reward.type}</p>
                <b>בבעלותך ✓</b>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
