import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { buyReward, loadUserProfile } from "../services/userService.js";

const rewards = [
  { id: "lion-avatar", icon: "🦁", title: "אווטאר אריה", price: 20 },
  { id: "crown-badge", icon: "👑", title: "תג מלך", price: 35 },
  { id: "forest-theme", icon: "🌲", title: "רקע יער", price: 50 },
  { id: "gold-star", icon: "🌟", title: "כוכב זהב", price: 75 },
  { id: "champion-cup", icon: "🏆", title: "גביע אלוף", price: 100 },
  { id: "secret-game", icon: "🕹️", title: "משחק סודי", price: 120 },
];

export default function RewardsPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState("");

  async function refresh() {
    setProfile(await loadUserProfile(currentUser.uid));
  }
  useEffect(() => { refresh(); }, [currentUser.uid]);

  async function purchase(reward) {
    setMessage("");
    try {
      await buyReward(currentUser.uid, reward);
      setMessage(`קנית את ${reward.title}!`);
      await refresh();
    } catch (e) {
      setMessage(e.message === "not-enough-coins" ? "אין מספיק מטבעות." : "הפרס כבר בבעלותך.");
    }
  }

  const owned = profile.ownedRewards || [];
  return <div className="content-page">
    <section className="page-title rewards-title"><span>🎁</span><div><em>חדר הפרסים</em><h1>המטבעות שלך: {profile.coins || 0}</h1><p>צוברים מטבעות בלימודים, בכושר ובמשחקים.</p></div></section>
    {message && <div className="message">{message}</div>}
    <section className="rewards-grid">
      {rewards.map((r) => <article key={r.id}>
        <span>{r.icon}</span><h3>{r.title}</h3><p>🪙 {r.price}</p>
        <button disabled={owned.includes(r.id)} onClick={() => purchase(r)}>
          {owned.includes(r.id) ? "נרכש ✓" : "קנייה"}
        </button>
      </article>)}
    </section>
  </div>;
}
