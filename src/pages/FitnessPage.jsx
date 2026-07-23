import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  addProgress,
  loadUserProfile,
  saveFitnessProfile,
} from "../services/userService.js";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

const FITNESS_RANKS = [
  { name: "מתחיל", min: 0, next: 20 },
  { name: "מתאמן", min: 20, next: 50 },
  { name: "חזק", min: 50, next: 100 },
  { name: "אלוף הכושר", min: 100, next: 180 },
  { name: "מאסטר", min: 180, next: 300 },
];

function getFitnessRank(points = 0) {
  const current = [...FITNESS_RANKS].reverse().find((rank) => points >= rank.min) || FITNESS_RANKS[0];
  const index = FITNESS_RANKS.indexOf(current);
  const next = FITNESS_RANKS[index + 1];
  const percent = next
    ? Math.max(0, Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100)))
    : 100;
  return { name: current.name, number: index + 1, percent, next: next?.min ?? current.min };
}

const EMPTY_FORM = {
  age: "",
  gender: "",
  height: "",
  weight: "",
  pushups: "",
  plankSeconds: "",
  currentLevel: "beginner",
  goal: "health",
  days: [],
};

const EXERCISES = {
  easy: [
    ["chair-stand.png", "קימה וישיבה מכיסא", "8 חזרות"],
    ["wall-push-start.png", "שכיבות סמיכה על קיר", "8 חזרות"],
    ["bird-dog.png", "בירד־דוג", "6 לכל צד"],
    ["back-bridge.png", "גשר גב", "10 חזרות"],
  ],
  medium: [
    ["chair-squat.png", "סקווט לכיסא", "12 חזרות"],
    ["incline-push.png", "פלאנק מוגבה", "25 שניות"],
    ["shoulder-taps.png", "נגיעות כתף", "8 לכל צד"],
    ["marching-bridge.png", "גשר בצעדה", "8 לכל צד"],
    ["single-leg-balance.png", "עמידה על רגל אחת", "25 שניות"],
  ],
  advanced: [
    ["chair-squat.png", "סקווט לכיסא", "16 חזרות"],
    ["elevated-plank.png", "פלאנק מוגבה", "40 שניות"],
    ["lunge-start.png", "מכרע אחורי", "10 לכל צד"],
    ["shoulder-taps.png", "נגיעות כתף", "12 לכל צד"],
    ["swimmer.png", "שחיין", "14 חזרות"],
  ],
};

function calculateLevel(form) {
  const age = Number(form.age || 0);
  const plank = Number(form.plankSeconds || 0);
  const pushups = Number(form.pushups || 0);

  if (age < 13 || plank < 20 || pushups < 5 || form.currentLevel === "beginner") {
    return "easy";
  }
  if (plank >= 45 && pushups >= 15 && form.currentLevel === "advanced") {
    return "advanced";
  }
  return "medium";
}

export default function FitnessPage() {
  const { currentUser } = useAuth();
  const [fitnessProfile, setFitnessProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fitnessPoints, setFitnessPoints] = useState(0);
  const [done, setDone] = useState([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadUserProfile(currentUser.uid)
      .then((profile) => {
        setFitnessPoints(Number(profile.fitnessProgress || 0));
        const saved = profile.fitnessProfile;
        const normalized = saved
          ? { ...EMPTY_FORM, ...saved, days: Array.isArray(saved.days) ? saved.days : [] }
          : null;

        if (
          normalized &&
          normalized.age &&
          normalized.gender &&
          normalized.days.length === 3
        ) {
          setFitnessProfile(normalized);
          setForm(normalized);
        } else {
          setForm(normalized || EMPTY_FORM);
          setEditing(true);
        }
      })
      .catch(() => setEditing(true));
  }, [currentUser.uid]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function toggleDay(day) {
    setForm((current) => {
      const days = Array.isArray(current.days) ? current.days : [];
      const exists = days.includes(day);

      if (exists) {
        return { ...current, days: days.filter((item) => item !== day) };
      }

      if (days.length >= 3) return current;
      return { ...current, days: [...days, day] };
    });
  }

  async function saveAssessment(event) {
    event.preventDefault();

    if (form.days.length !== 3) return;

    const next = {
      ...form,
      level: calculateLevel(form),
      createdAt: new Date().toISOString(),
    };

    await saveFitnessProfile(currentUser.uid, next);
    setFitnessProfile(next);
    setEditing(false);
    setDone([]);
    setCompleted(false);
  }

  const plan = EXERCISES[fitnessProfile?.level || "easy"];
  const progress = Math.round((done.length / plan.length) * 100);

  function toggleExercise(index) {
    setDone((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  async function finish() {
    if (done.length < plan.length) return;

    await addProgress(currentUser.uid, {
      xp: 40,
      coins: 20,
      completedWorkouts: 1,
      fitnessProgress: 7,
    });

    setFitnessPoints((value) => value + 7);
    setCompleted(true);
  }

  const rank = getFitnessRank(fitnessPoints);

  const coachImage = useMemo(
    () => completed
      ? "/assets/fitness-coach/celebrate.png"
      : "/assets/fitness-coach/ready.png",
    [completed]
  );

  if (editing) {
    return (
      <div className="content-page">
        <section className="page-title fitness-title">
          <img src="/assets/fitness-coach/hello.png" alt="מאמן כושר" />
          <div>
            <em>בדיקת התאמה</em>
            <h1>בונים לך תוכנית אישית</h1>
            <p>בחר בדיוק 3 ימים בשבוע.</p>
          </div>
        </section>

        <form className="assessment-card" onSubmit={saveAssessment}>
          <div className="assessment-grid">
            <label>גיל<input name="age" type="number" min="8" max="100" required value={form.age} onChange={updateField} /></label>
            <label>מין
              <select name="gender" required value={form.gender} onChange={updateField}>
                <option value="">בחירה</option><option value="male">בן</option><option value="female">בת</option>
              </select>
            </label>
            <label>גובה בס"מ<input name="height" type="number" min="100" max="230" required value={form.height} onChange={updateField} /></label>
            <label>משקל בק"ג<input name="weight" type="number" min="25" max="250" required value={form.weight} onChange={updateField} /></label>
            <label>כמה שכיבות סמיכה?<input name="pushups" type="number" min="0" max="100" required value={form.pushups} onChange={updateField} /></label>
            <label>כמה שניות פלאנק?<input name="plankSeconds" type="number" min="0" max="300" required value={form.plankSeconds} onChange={updateField} /></label>
            <label>רמת כושר נוכחית
              <select name="currentLevel" value={form.currentLevel} onChange={updateField}>
                <option value="beginner">מתחיל</option><option value="medium">בינוני</option><option value="advanced">מתקדם</option>
              </select>
            </label>
            <label>מטרה
              <select name="goal" value={form.goal} onChange={updateField}>
                <option value="health">בריאות כללית</option><option value="strength">חיזוק</option><option value="endurance">סיבולת</option><option value="posture">יציבה</option>
              </select>
            </label>
          </div>

          <div className="days-picker">
            <h3>בחר בדיוק 3 ימי אימון</h3>
            <div>
              {DAYS.map((day) => (
                <button
                  type="button"
                  key={day}
                  className={form.days.includes(day) ? "selected" : ""}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            <p>{form.days.length}/3 ימים נבחרו</p>
          </div>

          <button className="primary" disabled={form.days.length !== 3}>
            יצירת תוכנית אישית
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="content-page fitness-page">
      <section className="page-title fitness-title fitness-visual-title">
        <img src={coachImage} alt="מאמן הכושר" />
        <div>
          <em>מסע הכושר</em>
          <h1>{completed ? "כל הכבוד!" : "האימון האישי שלך"}</h1>
          <p>ימי אימון: {(fitnessProfile.days || []).join(", ")}</p>
        </div>
      </section>

      <section className="rank-card rank-card--fitness">
        <div>
          <small>הדרגה שלי בכושר</small>
          <h2>דרגה {rank.number} · {rank.name}</h2>
          <p>{fitnessPoints} נקודות כושר</p>
        </div>
        <div className="rank-progress">
          <span style={{ width: `${rank.percent}%` }} />
        </div>
        <small>{rank.percent === 100 ? "הדרגה הגבוהה ביותר" : `${rank.percent}% לדרגה הבאה`}</small>
      </section>

      <section className="fitness-summary">
        <article><small>רמה מותאמת</small><b>{fitnessProfile.level === "easy" ? "מתחיל" : fitnessProfile.level === "medium" ? "בינוני" : "מתקדם"}</b></article>
        <article><small>מטרה</small><b>{fitnessProfile.goal === "strength" ? "חיזוק" : fitnessProfile.goal === "endurance" ? "סיבולת" : fitnessProfile.goal === "posture" ? "יציבה" : "בריאות"}</b></article>
        <article><small>אימונים בשבוע</small><b>3</b></article>
        <button onClick={() => setEditing(true)}>שינוי בדיקת התאמה</button>
      </section>

      <section className="workout-progress">
        <div><b>האימון להיום</b><span>{progress}% הושלם</span></div>
        <progress value={done.length} max={plan.length} />
      </section>

      <section className="exercise-grid">
        {plan.map((item, index) => (
          <article key={item[1]} className={done.includes(index) ? "done" : ""}>
            <img src={`/assets/exercises/${item[0]}`} alt={item[1]} />
            <div><h3>{item[1]}</h3><p>{item[2]}</p></div>
            <button onClick={() => toggleExercise(index)}>
              {done.includes(index) ? "בוצע ✓" : "סמן כבוצע"}
            </button>
          </article>
        ))}
      </section>

      <button
        className="primary finish"
        disabled={done.length < plan.length || completed}
        onClick={finish}
      >
        {completed ? "האימון הושלם והפרס נוסף 🎉" : "סיום האימון וקבלת הפרס"}
      </button>
    </div>
  );
}
