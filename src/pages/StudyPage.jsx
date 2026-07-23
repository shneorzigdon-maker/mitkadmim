import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  addProgress,
  loadUserProfile,
  saveLearningTracks,
} from "../services/userService.js";

const TRACKS = [
  { id: "english-basic", subject: "english", icon: "🔤", title: "אנגלית בסיס", text: "אותיות ומילים ראשונות" },
  { id: "english-advanced", subject: "english", icon: "📘", title: "אנגלית מתקדמת", text: "אוצר מילים ומבחנים" },
  { id: "math-basic", subject: "math", icon: "➕", title: "חשבון בסיס", text: "חיבור, חיסור וכפל" },
  { id: "math-advanced", subject: "math", icon: "📐", title: "מתמטיקה מתקדמת", text: "שברים, אחוזים וגאומטריה" },
  { id: "language", subject: "language", icon: "✍️", title: "לשון", text: "שורשים, מילים ותחביר" },
  { id: "reading", subject: "language", icon: "📖", title: "הבנת הנקרא", text: "קטעים ושאלות" },
];

const ENGLISH_WORDS = [
  ["apple", "תפוח"], ["book", "ספר"], ["chair", "כיסא"], ["dog", "כלב"],
  ["house", "בית"], ["school", "בית ספר"], ["water", "מים"], ["friend", "חבר"],
  ["happy", "שמח"], ["strong", "חזק"], ["family", "משפחה"], ["morning", "בוקר"],
];

const MATH_QUESTIONS = [
  ["7 + 5", "12", ["10", "12", "14"]],
  ["9 - 4", "5", ["4", "5", "6"]],
  ["6 × 3", "18", ["12", "18", "21"]],
  ["20 ÷ 4", "5", ["4", "5", "6"]],
];

const LANGUAGE_QUESTIONS = [
  ["מה השורש של המילה 'כתיבה'?", "כתב", ["כתב", "כבה", "תיב"]],
  ["איזו מילה היא שם תואר?", "יפה", ["כיסא", "יפה", "רץ"]],
  ["מהו ההפך של 'גבוה'?", "נמוך", ["רחב", "נמוך", "מהיר"]],
  ["איזו מילה היא פועל?", "לומד", ["ספר", "לומד", "חכם"]],
];

export default function StudyPage() {
  const { currentUser } = useAuth();
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [screen, setScreen] = useState("tracks");
  const [subject, setSubject] = useState("english");
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [answered, setAnswered] = useState(false);
  const [englishPoints, setEnglishPoints] = useState(0);

  useEffect(() => {
    loadUserProfile(currentUser.uid)
      .then((profile) => {
        setSelectedTracks(profile.selectedLearningTracks || []);
        setEnglishPoints(Number(profile.englishProgress || 0));
      })
      .catch(console.error);
  }, [currentUser.uid]);

  async function toggleTrack(trackId) {
    const next = selectedTracks.includes(trackId)
      ? selectedTracks.filter((id) => id !== trackId)
      : [...selectedTracks, trackId];

    setSelectedTracks(next);
    await saveLearningTracks(currentUser.uid, next);
  }

  function openSubject(value) {
    setSubject(value);
    setIndex(0);
    setAnswered(false);
    setMessage("");
    setScreen("lesson");
  }

  const englishCurrent = ENGLISH_WORDS[index % ENGLISH_WORDS.length];
  const questions = subject === "math" ? MATH_QUESTIONS : LANGUAGE_QUESTIONS;
  const currentQuestion = questions[index % questions.length];

  async function learnEnglish() {
    await addProgress(currentUser.uid, {
      xp: 10,
      coins: 5,
      completedLessons: 1,
      englishProgress: 5,
    });
    setEnglishPoints((value) => value + 5);
    setMessage("כל הכבוד! קיבלת 5 מטבעות.");
    setIndex((value) => value + 1);
  }

  async function answer(value) {
    if (answered) return;
    setAnswered(true);

    const correct = value === currentQuestion[1];

    if (correct) {
      await addProgress(currentUser.uid, {
        xp: 8,
        coins: 4,
        completedLessons: 1,
        mathProgress: subject === "math" ? 5 : 0,
        languageProgress: subject === "language" ? 5 : 0,
      });
      setMessage("תשובה נכונה! +4 מטבעות");
    } else {
      setMessage(`כמעט. התשובה הנכונה: ${currentQuestion[1]}`);
    }
  }

  function nextQuestion() {
    setIndex((value) => value + 1);
    setAnswered(false);
    setMessage("");
  }

  const englishRankNumber = Math.min(5, Math.floor(englishPoints / 25) + 1);
  const englishRankNames = ["מתחיל", "חוקר מילים", "קורא צעיר", "מומחה", "אלוף אנגלית"];
  const englishRankPercent = englishRankNumber === 5 ? 100 : (englishPoints % 25) * 4;

  return (
    <div className="content-page english-page">
      <section className="page-title english-title">
        <img src="/assets/english-guide-book-cutout.png" alt="מדריך לימודים" />
        <div>
          <em>מרכז הלמידה</em>
          <h1>בוחרים מסלול ומתקדמים</h1>
          <p>אפשר לבחור מראש כמה מסלולים ולשנות אותם בהמשך.</p>
        </div>
      </section>

      <section className="rank-card rank-card--english">
        <div>
          <small>הדרגה שלי באנגלית</small>
          <h2>דרגה {englishRankNumber} · {englishRankNames[englishRankNumber - 1]}</h2>
          <p>{englishPoints} נקודות אנגלית</p>
        </div>
        <div className="rank-progress">
          <span style={{ width: `${englishRankPercent}%` }} />
        </div>
        <small>{englishRankPercent === 100 ? "הדרגה הגבוהה ביותר" : `${englishRankPercent}% לדרגה הבאה`}</small>
      </section>

      {screen === "tracks" && (
        <>
          <section className="track-selection">
            <div>
              <em>בחירת מסלולים</em>
              <h2>באילו מסלולים תרצה להתקדם?</h2>
              <p>לחיצה על מסלול שומרת אותו בחשבון שלך.</p>
            </div>

            <div className="track-grid">
              {TRACKS.map((track) => (
                <button
                  key={track.id}
                  className={selectedTracks.includes(track.id) ? "selected" : ""}
                  onClick={() => toggleTrack(track.id)}
                >
                  <span>{track.icon}</span>
                  <h3>{track.title}</h3>
                  <p>{track.text}</p>
                  <b>{selectedTracks.includes(track.id) ? "נבחר ✓" : "בחירה"}</b>
                </button>
              ))}
            </div>
          </section>

          <section className="subject-launchers">
            <button onClick={() => openSubject("english")}>
              <span>🇬🇧</span><h2>אנגלית</h2><p>כרטיסיות ואוצר מילים</p>
            </button>
            <button onClick={() => openSubject("math")}>
              <span>➗</span><h2>חשבון ומתמטיקה</h2><p>תרגילים ברמות שונות</p>
            </button>
            <button onClick={() => openSubject("language")}>
              <span>✍️</span><h2>לשון והבנת הנקרא</h2><p>שורשים, מילים ותחביר</p>
            </button>
          </section>
        </>
      )}

      {screen === "lesson" && (
        <>
          <button className="back-section" onClick={() => setScreen("tracks")}>
            ← חזרה למסלולים
          </button>

          {message && <div className="message">{message}</div>}

          {subject === "english" ? (
            <section className="lesson-card word-card">
              <div className="progress-label">
                מילה {index % ENGLISH_WORDS.length + 1} מתוך {ENGLISH_WORDS.length}
              </div>
              <div className="big-word">{englishCurrent[0]}</div>
              <div className="meaning">{englishCurrent[1]}</div>
              <div className="lesson-actions">
                <button className="secondary" onClick={() => setIndex((v) => v + 1)}>
                  מילה הבאה
                </button>
                <button className="primary" onClick={learnEnglish}>
                  למדתי +5 מטבעות
                </button>
              </div>
            </section>
          ) : (
            <section className="lesson-card quiz-card">
              <div className="score">
                {subject === "math" ? "חשבון ומתמטיקה" : "לשון"}
              </div>
              <h2>{currentQuestion[0]}</h2>
              <div className="answers">
                {currentQuestion[2].map((option) => (
                  <button
                    key={option}
                    disabled={answered}
                    onClick={() => answer(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {answered && (
                <button className="primary inline" onClick={nextQuestion}>
                  שאלה הבאה
                </button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
