import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const messages = {
  "auth/invalid-credential": "האימייל או הסיסמה אינם נכונים.",
  "auth/email-already-in-use": "כבר קיים חשבון עם האימייל הזה.",
  "auth/weak-password": "הסיסמה צריכה להכיל לפחות 6 תווים.",
  "auth/invalid-email": "כתובת האימייל אינה תקינה.",
  "auth/popup-closed-by-user": "חלון Google נסגר לפני סיום הפעולה.",
};
const friendly = (e) => messages[e?.code] || "לא הצלחנו להשלים את הפעולה. נסה שוב.";

function AuthFrame({ title, text, children }) {
  return <div className="auth-page">
    <section className="auth-hero">
      <Brand />
      <div><em>Education Platform</em><h1>{title}</h1><p>{text}</p>
      <aside><span>⭐ צוברים XP</span><span>🔥 בונים רצף</span><span>🏆 פותחים הישגים</span></aside></div>
    </section>
    <section className="auth-panel">{children}</section>
  </div>;
}

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const destination = location.state?.from || "/";

  async function run(action) {
    setError(""); setBusy(true);
    try { await action(); navigate(destination, { replace: true }); }
    catch (e) { setError(friendly(e)); }
    finally { setBusy(false); }
  }

  return <AuthFrame title="המסע שלך ממשיך בדיוק מהמקום שבו עצרת."
    text="לימודים, כושר, משחקים והישגים — במקום אחד.">
    <div className="auth-card"><em>שמחים שחזרת</em><h2>כניסה למתקדמים</h2>
      {error && <div className="error">{error}</div>}
      <button className="google" disabled={busy} onClick={() => run(loginWithGoogle)}>G&nbsp;&nbsp; המשך עם Google</button>
      <div className="or">או</div>
      <form onSubmit={(e) => { e.preventDefault(); run(() => loginWithEmail(form.email, form.password)); }}>
        <label>אימייל<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>סיסמה<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <Link className="forgot" to="/forgot-password">שכחתי סיסמה</Link>
        <button className="primary" disabled={busy}>{busy ? "מתחברים..." : "כניסה"}</button>
      </form>
      <p className="switch">אין לך חשבון? <Link to="/register">הרשמה</Link></p>
    </div>
  </AuthFrame>;
}

export function RegisterPage() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError(""); setBusy(true);
    try { await action(); navigate("/", { replace: true }); }
    catch (e) { setError(friendly(e)); }
    finally { setBusy(false); }
  }

  return <AuthFrame title="כל התקדמות גדולה מתחילה בצעד קטן."
    text="יוצרים חשבון אישי ושומרים את ההתקדמות במקום בטוח.">
    <div className="auth-card"><em>נעים להכיר</em><h2>יצירת חשבון</h2>
      {error && <div className="error">{error}</div>}
      <button className="google" disabled={busy} onClick={() => run(loginWithGoogle)}>G&nbsp;&nbsp; הרשמה עם Google</button>
      <div className="or">או</div>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (form.password !== form.confirm) return setError("הסיסמאות אינן זהות.");
        run(() => registerWithEmail(form));
      }}>
        <label>שם<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>אימייל<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>סיסמה<input type="password" minLength="6" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label>אימות סיסמה<input type="password" minLength="6" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></label>
        <button className="primary" disabled={busy}>{busy ? "יוצרים..." : "יצירת חשבון"}</button>
      </form>
      <p className="switch">כבר יש לך חשבון? <Link to="/login">כניסה</Link></p>
    </div>
  </AuthFrame>;
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    try { await resetPassword(email); setStatus("שלחנו קישור לאיפוס הסיסמה."); }
    catch (error) { setStatus(friendly(error)); }
  }

  return <div className="single-auth"><div className="auth-card">
    <Brand /><em>חוזרים במהירות</em><h2>איפוס סיסמה</h2>
    {status && <div className="message">{status}</div>}
    <form onSubmit={submit}>
      <label>אימייל<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <button className="primary">שליחת קישור</button>
    </form>
    <p className="switch"><Link to="/login">חזרה לכניסה</Link></p>
  </div></div>;
}
