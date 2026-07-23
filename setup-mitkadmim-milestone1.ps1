param([string]$ProjectPath = "C:\Projects\mitkadmim")
$ErrorActionPreference = "Stop"

function Save-File([string]$RelativePath, [string]$Content) {
  $full = Join-Path $ProjectPath $RelativePath
  $dir = Split-Path $full -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  [IO.File]::WriteAllText($full, $Content, [Text.UTF8Encoding]::new($false))
}

if (!(Test-Path (Join-Path $ProjectPath "package.json"))) {
  throw "לא נמצאה תיקיית הפרויקט: $ProjectPath"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $ProjectPath "backups\before-milestone1-$stamp"
New-Item -ItemType Directory -Force $backup | Out-Null
if (Test-Path (Join-Path $ProjectPath "src")) {
  Copy-Item (Join-Path $ProjectPath "src") (Join-Path $backup "src") -Recurse -Force
}
Copy-Item (Join-Path $ProjectPath "index.html") (Join-Path $backup "index.html") -Force
Write-Host "נוצר גיבוי: $backup" -ForegroundColor Green

Save-File "index.html" @'
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="מתקדמים — לומדים. מתקדמים. מצליחים." />
    <title>מתקדמים</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@

Save-File "src\main.jsx" @'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
'@

Save-File "src\firebase\firebase.js" @'
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDx6nm4vL1FiJPZniORtbkeY7Vz09F0QYM",
  authDomain: "mitkadmim-7576b.firebaseapp.com",
  projectId: "mitkadmim-7576b",
  storageBucket: "mitkadmim-7576b.firebasestorage.app",
  messagingSenderId: "663139177002",
  appId: "1:663139177002:web:7f0fac05d10310968ee953",
  measurementId: "G-M2QYLLWD4K",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

setPersistence(auth, browserLocalPersistence).catch(console.error);
export default app;
'@

Save-File "src\services\userService.js" @'
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

export async function syncUser(user, extra = {}) {
  if (!user?.uid) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const common = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || extra.displayName || "",
    photoURL: user.photoURL || "",
    lastLoginAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...common,
      createdAt: serverTimestamp(),
      xp: 0,
      coins: 0,
      streak: 0,
      level: 1,
      role: "user",
      ...extra,
    }, { merge: true });
  } else {
    await setDoc(ref, { ...common, ...extra }, { merge: true });
  }
}

export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : {};
}
'@

Save-File "src\contexts\AuthContext.jsx" @'
import {
  createContext, useContext, useEffect, useMemo, useState
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase.js";
import { syncUser } from "../services/userService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    if (user) {
      try { await syncUser(user); } catch (e) { console.error(e); }
    }
    setAuthLoading(false);
  }), []);

  async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    await syncUser(result.user);
    return result.user;
  }

  async function registerWithEmail({ name, email, password }) {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) {
      await updateProfile(result.user, { displayName: name.trim() });
      await result.user.reload();
    }
    await syncUser(auth.currentUser, { displayName: name.trim() });
    setCurrentUser(auth.currentUser);
    return auth.currentUser;
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUser(result.user);
    return result.user;
  }

  const value = useMemo(() => ({
    currentUser,
    authLoading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    logout: () => signOut(auth),
  }), [currentUser, authLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
'@

Save-File "src\utils\authErrors.js" @'
const messages = {
  "auth/invalid-credential": "האימייל או הסיסמה אינם נכונים.",
  "auth/email-already-in-use": "כבר קיים חשבון עם כתובת האימייל הזו.",
  "auth/weak-password": "הסיסמה צריכה להכיל לפחות 6 תווים.",
  "auth/invalid-email": "כתובת האימייל אינה תקינה.",
  "auth/popup-closed-by-user": "חלון ההתחברות נסגר לפני סיום הפעולה.",
  "auth/too-many-requests": "בוצעו יותר מדי ניסיונות. נסה שוב מאוחר יותר.",
  "auth/network-request-failed": "בדוק את החיבור לאינטרנט ונסה שוב.",
};
export const friendlyAuthError = (error) =>
  messages[error?.code] || "לא הצלחנו להשלים את הפעולה. נסה שוב.";
'@

Save-File "src\App.jsx" @'
import { useEffect, useMemo, useState } from "react";
import {
  Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import { loadProfile } from "./services/userService.js";
import { friendlyAuthError } from "./utils/authErrors.js";

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="logo">מ</span>
      <span><b>מתקדמים</b>{!compact && <small>לומדים. מתקדמים. מצליחים.</small>}</span>
    </div>
  );
}

function Loading() {
  return <div className="loading"><span className="logo">מ</span><i /><p>טוענים...</p></div>;
}

function Protected() {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <Loading />;
  return currentUser ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function PublicOnly() {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return <Loading />;
  return currentUser ? <Navigate to="/" replace /> : <Outlet />;
}

function AuthShell({ children, title, text }) {
  return (
    <div className="auth-page">
      <section className="auth-hero">
        <Brand />
        <div>
          <em>Education Platform</em>
          <h1>{title}</h1>
          <p>{text}</p>
          <aside><span>⭐ XP</span><span>🔥 רצף</span><span>🏆 הישגים</span></aside>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </div>
  );
}

function Login() {
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
    catch (e) { setError(friendlyAuthError(e)); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="המסע שלך ממשיך בדיוק מהמקום שבו עצרת."
      text="לימודים, כושר, משחקים והישגים — במקום אחד.">
      <div className="auth-card">
        <em>שמחים שחזרת</em><h2>כניסה למתקדמים</h2>
        {error && <div className="error">{error}</div>}
        <button className="google" disabled={busy} onClick={() => run(loginWithGoogle)}>G&nbsp;&nbsp; המשך עם Google</button>
        <div className="or">או</div>
        <form onSubmit={(e) => { e.preventDefault(); run(() => loginWithEmail(form.email, form.password)); }}>
          <label>אימייל<input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>סיסמה<input type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <Link className="forgot" to="/forgot-password">שכחתי סיסמה</Link>
          <button className="primary" disabled={busy}>{busy ? "מתחברים..." : "כניסה"}</button>
        </form>
        <p className="switch">אין לך חשבון? <Link to="/register">הרשמה</Link></p>
      </div>
    </AuthShell>
  );
}

function Register() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError(""); setBusy(true);
    try { await action(); navigate("/", { replace: true }); }
    catch (e) { setError(friendlyAuthError(e)); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="כל התקדמות גדולה מתחילה בצעד קטן."
      text="יוצרים חשבון אישי ושומרים את ההתקדמות במקום בטוח.">
      <div className="auth-card">
        <em>נעים להכיר</em><h2>יצירת חשבון</h2>
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
    </AuthShell>
  );
}

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  async function submit(e) {
    e.preventDefault(); setStatus("");
    try { await resetPassword(email); setStatus("שלחנו קישור לאיפוס הסיסמה."); }
    catch (error) { setStatus(friendlyAuthError(error)); }
  }
  return (
    <div className="single-auth"><div className="auth-card"><Brand />
      <em>חוזרים במהירות</em><h2>איפוס סיסמה</h2>
      {status && <div className="message">{status}</div>}
      <form onSubmit={submit}><label>אימייל<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <button className="primary">שליחת קישור</button></form>
      <p className="switch"><Link to="/login">חזרה לכניסה</Link></p>
    </div></div>
  );
}

function Layout() {
  const { currentUser, logout } = useAuth();
  return <div className="shell">
    <header><Link to="/"><Brand compact /></Link><div className="user">
      <Link to="/profile">{currentUser.photoURL ? <img src={currentUser.photoURL} alt="" /> : <span>{(currentUser.displayName || currentUser.email || "מ")[0]}</span>}<b>{currentUser.displayName || "הפרופיל שלי"}</b></Link>
      <button onClick={logout}>יציאה</button>
    </div></header>
    <main><Outlet /></main>
    <nav>
      {[["/","🏠","בית"],["/study","📘","לימודים"],["/fitness","💪","כושר"],["/games","🎮","משחקים"],["/profile","👤","פרופיל"]].map(([to,icon,label]) =>
        <NavLink key={to} to={to} end={to === "/"} className={({isActive}) => isActive ? "active" : ""}><span>{icon}</span><small>{label}</small></NavLink>
      )}
    </nav>
  </div>;
}

function Home() {
  const { currentUser } = useAuth();
  const name = currentUser.displayName?.split(" ")[0] || currentUser.email?.split("@")[0] || "אלוף";
  const encouragements = ["התקדמות קטנה בכל יום יוצרת הצלחה גדולה.","כל ניסיון מקרב אותך למטרה.","שמחים שחזרת — ממשיכים קדימה.","היום הוא הזדמנות חדשה להתקדם."];
  const msg = useMemo(() => encouragements[new Date().getDate() % encouragements.length], []);
  return <div>
    <section className="hero"><div><em>ברוך הבא למתקדמים</em><h1>שלום, {name} 👋</h1><p>{msg}</p></div><div className="orbit">⭐<b>מתקדמים</b></div></section>
    <section className="stats"><article>⭐<div><b>0</b><small>XP</small></div></article><article>🔥<div><b>0</b><small>רצף ימים</small></div></article><article>🏆<div><b>מתחיל</b><small>דרגה</small></div></article></section>
    <div className="heading"><em>מה נתקדם היום?</em><h2>בוחרים מסלול ומתחילים</h2></div>
    <section className="cards">
      <Feature to="/study" icon="📘" title="לימודים" text="אנגלית, מתמטיקה, הסברים ובוחנים." color="blue" />
      <Feature to="/fitness" icon="💪" title="מסע הכושר" text="תרגילים, משימות, רצף והתקדמות." color="green" />
      <Feature to="/games" icon="🎮" title="משחקים" text="משחקים מהנים, אתגרים ועולמות." color="purple" />
    </section>
    <section className="continue">▶<div><em>המשך מהמקום האחרון</em><h2>עוד לא התחלת פעילות חדשה</h2><p>לאחר הפעילות הראשונה נציג כאן קיצור דרך להמשך.</p></div></section>
  </div>;
}

function Feature({ to, icon, title, text, color }) {
  return <Link className={`feature ${color}`} to={to}><span>{icon}</span><h2>{title}</h2><p>{text}</p><b>נכנסים ←</b></Link>;
}

function Section({ icon, title, text }) {
  return <section className="placeholder"><span>{icon}</span><em>השלב הבא בבנייה</em><h1>{title}</h1><p>{text}</p>
    <aside>התשתית מוכנה. בשלב הבא נכניס לכאן את התכנים והפעילויות שתכננו בתחילת הפרויקט.</aside>
    <Link className="primary inline" to="/">חזרה לבית</Link></section>;
}

function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  useEffect(() => { loadProfile(currentUser.uid).then(setProfile); }, [currentUser.uid]);
  if (!profile) return <Loading />;
  return <div className="profile">
    <section><div className="avatar">{currentUser.photoURL ? <img src={currentUser.photoURL} alt="" /> : <span>{(currentUser.displayName || currentUser.email || "מ")[0]}</span>}</div>
      <div><em>הפרופיל שלי</em><h1>{currentUser.displayName || "משתמש מתקדמים"}</h1><p>{currentUser.email}</p></div></section>
    <div className="profile-stats">{[["רמה",profile.level ?? 1],["XP",profile.xp ?? 0],["מטבעות",profile.coins ?? 0],["רצף",profile.streak ?? 0]].map(([k,v]) => <article key={k}><small>{k}</small><b>{v}</b></article>)}</div>
    <aside>המשתמשים הקיימים נשמרים. עדכון מסמך המשתמש מתבצע עם <code>merge:true</code> ולכן שדות קיימים אינם נמחקים.</aside>
  </div>;
}

export default function App() {
  return <Routes>
    <Route element={<PublicOnly />}><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<ForgotPassword />} /></Route>
    <Route element={<Protected />}><Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/study" element={<Section icon="📘" title="לימודים" text="כאן נרכז אנגלית, מתמטיקה, הסברים ובוחנים." />} />
      <Route path="/fitness" element={<Section icon="💪" title="מסע הכושר" text="כאן יופיעו מסלול הכושר, המשימות והרצף." />} />
      <Route path="/games" element={<Section icon="🎮" title="משחקים" text="כאן נוסיף את המשחקים והעולמות." />} />
      <Route path="/profile" element={<Profile />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
'@

Save-File "src\styles.css" @'
:root{font-family:Arial,"Segoe UI",sans-serif;color:#17213d;background:#f5f7ff;--p:#5f55e7;--blue:#3d7df5;--purple:#8058df;--green:#2aa876;--muted:#68708a;--border:#e5e8f5;--shadow:0 22px 60px rgba(48,56,107,.12)}*{box-sizing:border-box}html{direction:rtl}body{margin:0;min-width:320px;min-height:100vh;background:radial-gradient(circle at 10% 0%,rgba(118,108,255,.15),transparent 30%),#f5f7ff}button,input{font:inherit}a{color:inherit;text-decoration:none}.brand{display:flex;align-items:center;gap:13px}.brand>b,.brand span b{display:block;font-size:1.3rem}.brand small{display:block;margin-top:3px;color:var(--muted)}.logo{width:50px;height:50px;display:grid;place-items:center;border-radius:17px;color:#fff;font-size:1.55rem;font-weight:900;background:linear-gradient(135deg,var(--blue),var(--purple));box-shadow:0 12px 28px rgba(91,82,225,.3)}.compact .logo{width:42px;height:42px;border-radius:14px;font-size:1.25rem}.compact small{display:none}.auth-page{min-height:100vh;display:grid;grid-template-columns:1fr minmax(400px,540px)}.auth-hero{padding:48px clamp(28px,5vw,84px);color:#fff;background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.16),transparent 30%),linear-gradient(145deg,#3c73ef,#6852dd 55%,#8b5bdc)}.auth-hero .brand small{color:#ffffffc7}.auth-hero>div:last-child{margin-top:min(18vh,170px);max-width:650px}.auth-hero h1{margin:18px 0;font-size:clamp(2.3rem,5vw,4.8rem);line-height:1.08}.auth-hero p{color:#ffffffd9;font-size:1.15rem;line-height:1.8}.auth-hero aside{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}.auth-hero aside span{padding:11px 15px;border:1px solid #ffffff32;border-radius:999px;background:#ffffff18}.auth-panel,.single-auth{display:grid;place-items:center;padding:30px;min-height:100vh}.auth-card{width:min(100%,430px);padding:35px;border:1px solid var(--border);border-radius:28px;background:#fff;box-shadow:var(--shadow)}em{font-style:normal;color:var(--p);font-size:.78rem;font-weight:900;letter-spacing:.06em}.auth-card h2{font-size:2rem;margin:8px 0 18px}.auth-card form{display:grid;gap:16px}.auth-card label{display:grid;gap:8px;font-size:.9rem;font-weight:700}.auth-card input{height:50px;padding:0 14px;border:1px solid #dfe3f1;border-radius:14px;outline:none}.auth-card input:focus{border-color:var(--p);box-shadow:0 0 0 4px #5f55e719}.auth-card button,.primary{min-height:48px;border:0;border-radius:14px;font-weight:800;cursor:pointer}.google{width:100%;margin:4px 0 18px;border:1px solid #dfe3f1!important;background:#fff}.primary{display:inline-flex;align-items:center;justify-content:center;padding:0 20px;color:#fff;background:linear-gradient(135deg,var(--blue),var(--purple));box-shadow:0 12px 26px rgba(91,82,225,.24)}.or{display:flex;align-items:center;gap:12px;color:#9299af;font-size:.8rem;margin-bottom:18px}.or:before,.or:after{content:"";height:1px;flex:1;background:#e3e6f1}.forgot{justify-self:end;color:var(--p);font-weight:800}.switch{text-align:center;color:var(--muted)}.switch a{color:var(--p);font-weight:800}.error,.message{padding:13px 15px;margin:0 0 16px;border-radius:13px;background:#fff0f3;color:#9a2942}.message{background:#eafaf3;color:#167453}.shell{min-height:100vh;padding-bottom:95px}.shell header{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:13px clamp(16px,4vw,60px);border-bottom:1px solid #e1e4f1d9;background:#ffffffd9;backdrop-filter:blur(16px)}.user,.user>a{display:flex;align-items:center;gap:10px}.user img,.user>a>span{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;object-fit:cover;color:#fff;font-weight:800;background:linear-gradient(135deg,var(--blue),var(--purple))}.user button{min-height:40px;padding:0 14px;border:1px solid #dfe3f1;border-radius:13px;background:#fff;font-weight:800}.shell main{width:min(1180px,calc(100% - 32px));margin:auto;padding:34px 0 60px}.shell nav{position:fixed;z-index:30;right:50%;bottom:16px;width:min(620px,calc(100% - 24px));display:grid;grid-template-columns:repeat(5,1fr);padding:8px;transform:translateX(50%);border:1px solid #dce0f0e6;border-radius:22px;background:#ffffffed;box-shadow:0 18px 46px rgba(45,53,102,.16);backdrop-filter:blur(16px)}.shell nav a{min-height:58px;display:grid;place-items:center;align-content:center;gap:3px;border-radius:16px;color:#7c839a}.shell nav a.active{color:var(--p);background:#f0efff}.shell nav span{font-size:1.25rem}.shell nav small{font-weight:800}.hero{min-height:270px;display:flex;align-items:center;justify-content:space-between;padding:clamp(28px,5vw,58px);border-radius:32px;color:#fff;background:linear-gradient(135deg,#3c75ee,#6952df 60%,#8c59db);box-shadow:var(--shadow)}.hero em{color:#fff}.hero h1{font-size:clamp(2.2rem,5vw,4.2rem);margin:10px 0}.hero p{color:#ffffffd4}.orbit{width:185px;aspect-ratio:1;display:grid;place-items:center;border:1px solid #ffffff38;border-radius:50%;font-size:3rem;background:#ffffff18}.orbit b{font-size:1rem}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}.stats article{display:flex;align-items:center;gap:16px;padding:20px;border:1px solid var(--border);border-radius:20px;background:#fff}.stats article>div>*{display:block}.stats small{color:var(--muted)}.heading{margin:46px 0 18px}.heading h2{margin:5px 0}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.feature{min-height:250px;display:flex;flex-direction:column;padding:24px;border:1px solid var(--border);border-radius:26px;background:#fff;box-shadow:0 12px 34px rgba(49,58,107,.07)}.feature>span{font-size:2.6rem}.feature h2{margin:27px 0 8px;color:#17213d}.feature p{margin:0;color:var(--muted);line-height:1.65}.feature b{margin-top:auto;padding-top:18px}.blue{color:var(--blue)}.green{color:var(--green)}.purple{color:var(--purple)}.continue{display:flex;align-items:center;gap:22px;margin-top:22px;padding:25px;border:1px solid var(--border);border-radius:24px;background:#fff}.continue>first-child{font-size:2rem}.continue h2{margin:6px 0}.continue p{margin:0;color:var(--muted)}.placeholder{max-width:760px;margin:30px auto;padding:44px;text-align:center;border:1px solid var(--border);border-radius:30px;background:#fff;box-shadow:var(--shadow)}.placeholder>span{display:block;font-size:4rem}.placeholder h1{font-size:2.5rem;margin:10px 0}.placeholder p{color:var(--muted);line-height:1.7}.placeholder aside,.profile>aside{padding:18px;border:1px solid var(--border);border-radius:18px;background:#f8f9ff;color:#555f7b;line-height:1.7}.inline{width:max-content;margin:22px auto 0}.profile{display:grid;gap:20px}.profile>section{display:flex;align-items:center;gap:24px;padding:34px;border:1px solid var(--border);border-radius:28px;background:#fff;box-shadow:var(--shadow)}.avatar img,.avatar span{width:100px;height:100px;display:grid;place-items:center;border-radius:30px;object-fit:cover;color:#fff;font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,var(--blue),var(--purple))}.profile h1{margin:6px 0}.profile p{margin:0;color:var(--muted)}.profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.profile-stats article{padding:24px;border:1px solid var(--border);border-radius:20px;background:#fff}.profile-stats small,.profile-stats b{display:block}.profile-stats small{color:var(--muted)}.profile-stats b{font-size:1.5rem;margin-top:8px}.loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:16px}.loading i{width:38px;height:38px;border:4px solid #e1e4f2;border-top-color:var(--p);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.auth-page{grid-template-columns:1fr}.auth-hero{min-height:330px;padding:30px}.auth-hero>div:last-child{margin-top:45px}.cards{grid-template-columns:1fr}.orbit{width:140px}}@media(max-width:650px){.auth-hero{min-height:260px}.auth-hero h1{font-size:2.25rem}.auth-hero p,.auth-hero aside{display:none}.auth-panel{padding:16px}.auth-card{padding:25px 20px}.user b,.user button,.compact small{display:none}.shell main{width:calc(100% - 22px);padding-top:18px}.hero{min-height:230px;padding:28px 22px;border-radius:26px}.orbit{display:none}.stats{grid-template-columns:1fr;gap:10px}.feature{min-height:225px}.profile>section{display:grid;padding:24px}.profile-stats{grid-template-columns:repeat(2,1fr)}.placeholder{padding:30px 20px}.shell nav{bottom:9px}.shell nav a{min-height:54px}.shell nav small{font-size:.68rem}}
'@

foreach ($old in @("src\App.css","src\index.css")) {
  $path = Join-Path $ProjectPath $old
  if (Test-Path $path) { Remove-Item $path -Force }
}

Write-Host ""
Write-Host "Milestone 1 הותקן בהצלחה." -ForegroundColor Green
Write-Host "המשתמשים הקיימים ב-Firebase Authentication לא נמחקו." -ForegroundColor Green
Write-Host "מסמכי משתמש קיימים מתעדכנים עם merge:true." -ForegroundColor Green
Write-Host ""
Write-Host "כעת הרץ:" -ForegroundColor Cyan
Write-Host "cd `"$ProjectPath`""
Write-Host "npm run dev"
