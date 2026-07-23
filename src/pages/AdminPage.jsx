import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { ADMIN_EMAIL, listUsersForAdmin } from "../services/userService.js";
import { Loading } from "../components/Layout.jsx";

function dateText(value) {
  if (!value?.seconds) return "—";
  return new Date(value.seconds * 1000).toLocaleString("he-IL");
}

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listUsersForAdmin(currentUser.email).then(setUsers).catch((e) => {
      console.error(e);
      setError("לא ניתן לקרוא את רשימת המשתמשים. ייתכן שצריך לעדכן את חוקי Firestore.");
    });
  }, [currentUser.email]);

  if (currentUser.email !== ADMIN_EMAIL) {
    return <section className="result-card"><span>⛔</span><h1>אין הרשאת מנהל</h1></section>;
  }
  if (error) return <section className="result-card"><span>⚠️</span><h1>{error}</h1></section>;
  if (!users) return <Loading text="טוענים משתמשים..." />;

  return <div className="content-page">
    <section className="page-title admin-title"><span>🛠️</span><div><em>חדר הבקרה</em><h1>{users.length} משתמשים</h1><p>רשימת המשתמשים שנשמרו ב־Firestore.</p></div></section>
    <div className="table-wrap"><table>
      <thead><tr><th>שם</th><th>אימייל</th><th>נרשם</th><th>כניסה אחרונה</th><th>XP</th><th>מטבעות</th><th>לימודים</th><th>כושר</th><th>משחקים</th></tr></thead>
      <tbody>{users.map((u) => <tr key={u.id}>
        <td>{u.displayName || "—"}</td><td>{u.email || "—"}</td>
        <td>{dateText(u.createdAt)}</td><td>{dateText(u.lastLoginAt)}</td>
        <td>{u.xp || 0}</td><td>{u.coins || 0}</td>
        <td>{u.completedLessons || 0}</td><td>{u.completedWorkouts || 0}</td><td>{u.completedGames || 0}</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}
