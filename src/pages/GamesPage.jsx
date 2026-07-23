import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { addProgress, loadUserProfile } from "../services/userService.js";

const questions = [
  ["איזו מילה פירושה בית?", "house", ["water", "house", "book"]],
  ["איזו מילה פירושה שמח?", "happy", ["strong", "friend", "happy"]],
  ["כמה הם 7 + 5?", "12", ["10", "12", "14"]],
  ["איזה תרגיל מחזק שיווי משקל?", "עמידה על רגל אחת", ["ריצה", "עמידה על רגל אחת", "קריאה"]],
];

export default function GamesPage() {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState("menu");
  const [profile, setProfile] = useState({});
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [runnerScore, setRunnerScore] = useState(0);
  const [jumping, setJumping] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { loadUserProfile(currentUser.uid).then(setProfile); }, [currentUser.uid]);
  const secretUnlocked = (profile.ownedRewards || []).includes("secret-game");

  async function answer(value) {
    const correct = value === questions[i][1];
    if (correct) setScore((v) => v + 1);
    if (i === questions.length - 1) {
      const finalScore = score + (correct ? 1 : 0);
      await addProgress(currentUser.uid, { xp: finalScore * 5, coins: finalScore * 3, completedGames: 1 });
      setFinished(true);
    } else setI((v) => v + 1);
  }

  function startRunner() {
    setMode("runner"); setRunnerScore(0); setJumping(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRunnerScore((value) => value + 1), 700);
  }

  async function endRunner() {
    clearInterval(timerRef.current);
    await addProgress(currentUser.uid, { xp: Math.min(runnerScore, 30), coins: Math.min(Math.floor(runnerScore / 2), 15), completedGames: 1 });
    setMode("runner-result");
  }

  if (mode === "menu") return <div className="content-page">
    <section className="page-title game-visual-title"><img src="/assets/game/uri-front.png" alt="דמות המשחק" /><div><em>עולם המשחקים</em><h1>בוחרים משחק</h1><p>משחקים וצוברים XP ומטבעות.</p></div></section>
    <section className="game-menu">
      <button onClick={() => setMode("quiz")}><span>🧠</span><h2>משחק האתגר</h2><p>אנגלית, חשבון וכושר.</p></button>
      <button className={!secretUnlocked ? "locked" : ""} disabled={!secretUnlocked} onClick={startRunner}><span>🌲</span><h2>משחק היער הסודי</h2><p>{secretUnlocked ? "רוצו, קפצו וצברו נקודות." : "פותחים בחדר הפרסים."}</p></button>
    </section>
  </div>;

  if (mode === "runner" || mode === "runner-result") return <div className="runner-page">
    <section className="runner-stage">
      <div className="runner-score">ניקוד: {runnerScore}</div>
      <img className={`runner-character ${jumping ? "jump" : ""}`} src={jumping ? "/assets/secret-game/uri-jump.png" : "/assets/secret-game/uri-run.png"} alt="רץ ביער" />
      <img className="runner-obstacle" src="/assets/secret-game/stump.png" alt="מכשול" />
      <div className="runner-items"><img src="/assets/secret-game/star.png" alt="כוכב" /><img src="/assets/secret-game/diamond.png" alt="יהלום" /></div>
    </section>
    {mode === "runner" ? <div className="runner-controls"><button className="primary" onMouseDown={() => setJumping(true)} onMouseUp={() => setJumping(false)} onTouchStart={() => setJumping(true)} onTouchEnd={() => setJumping(false)}>קפיצה</button><button className="secondary" onClick={endRunner}>סיום המשחק</button></div> : <section className="result-card"><span>🏆</span><h1>צברת {runnerScore} נקודות!</h1><button className="primary" onClick={() => setMode("menu")}>חזרה למשחקים</button></section>}
  </div>;

  if (finished) return <section className="result-card"><span>🏆</span><h1>סיימת את המשחק!</h1><p>ענית נכון על {score} מתוך {questions.length}.</p><button className="primary" onClick={() => { setI(0); setScore(0); setFinished(false); setMode("menu"); }}>חזרה למשחקים</button></section>;

  const q = questions[i];
  return <div className="content-page"><button className="back-section" onClick={() => setMode("menu")}>← חזרה למשחקים</button><section className="game-card"><div className="score">שאלה {i + 1} מתוך {questions.length} | ניקוד: {score}</div><h2>{q[0]}</h2><div className="answers">{q[2].map((x) => <button key={x} onClick={() => answer(x)}>{x}</button>)}</div></section></div>;
}
