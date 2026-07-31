import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LegacyAppFrame, type LegacyAppHandle } from './components/LegacyAppFrame';

type Domain = 'english' | 'fitness';

type AppState = {
  profile?: {
    name?: string;
    firstName?: string;
    domains?: Domain[];
    avatar?: string | { value?: string };
  };
  appLevel?: number;
  levelTasks?: number;
  points?: number;
  coins?: number;
  day?: number;
  streak?: number;
  learned?: unknown[] | Record<string, unknown>;
  completed?: Record<string, unknown>;
  fitness?: {
    points?: number;
    logs?: Array<{ date?: string; minutes?: number }>;
    completed?: Record<string, unknown>;
    configured?: boolean;
  };
};

function readState(): AppState | null {
  try {
    const raw = localStorage.getItem('mamriimState');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    return parsed?.profile ? parsed : null;
  } catch {
    return null;
  }
}

function countLearned(state: AppState) {
  if (Array.isArray(state.learned)) return state.learned.length;
  if (state.learned && typeof state.learned === 'object') return Object.keys(state.learned).length;
  return Number(state.day || 1) > 1 ? Math.max(0, Number(state.day || 1) - 1) * 5 : 0;
}

function getInitial(name?: string) {
  return (name || 'א').trim().charAt(0) || 'א';
}

export function App() {
  const legacyRef = useRef<LegacyAppHandle>(null);
  const [state, setState] = useState<AppState | null>(() => readState());
  const [legacyVisible, setLegacyVisible] = useState(() => !readState());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const refresh = () => {
      const next = readState();
      setState(next);
      if (!next) setLegacyVisible(true);
    };
    const timer = window.setInterval(refresh, 900);
    const storage = () => refresh();
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('storage', storage);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', storage);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const openLegacy = useCallback((screen: string, action?: string) => {
    setLegacyVisible(true);
    window.setTimeout(() => legacyRef.current?.open(screen, action), 80);
  }, []);

  const summary = useMemo(() => {
    if (!state) return null;
    const level = Math.max(1, Number(state.appLevel) || 1);
    const tasks = Math.max(0, Number(state.levelTasks) || 0);
    const fitnessPoints = Number(state.fitness?.points) || 0;
    const generalPoints = Number(state.points) || 0;
    const coins = Number(state.coins) || Math.floor((generalPoints + fitnessPoints) / 10);
    const fitnessLogs = Array.isArray(state.fitness?.logs) ? state.fitness!.logs!.length : 0;
    return {
      level,
      tasks,
      progress: Math.min(100, (tasks / 5) * 100),
      coins,
      words: countLearned(state),
      fitnessLogs,
      streak: Math.max(0, Number(state.streak) || 0),
    };
  }, [state]);

  const name = state?.profile?.firstName || state?.profile?.name || 'אלוף';
  const domains = state?.profile?.domains || ['english', 'fitness'];
  const hasEnglish = domains.includes('english');
  const hasFitness = domains.includes('fitness');

  return (
    <main className="app-shell" dir="rtl">
      {!online && <div className="network-banner">אין כרגע חיבור לאינטרנט. השינויים יישמרו בענן כשהחיבור יחזור.</div>}

      {state && !legacyVisible && summary ? (
        <div className="modern-home">
          <header className="topbar">
            <div className="brand" aria-label="מתקדמים">
              <div className="brand-mark">מ</div>
              <div><strong>מתקדמים</strong><span>לומדים. מתחזקים. מצליחים.</span></div>
            </div>
            <div className="top-actions">
              <button className="icon-button" onClick={() => openLegacy('settings')} aria-label="הגדרות">⚙️</button>
              <button className="profile-chip" onClick={() => openLegacy('home')}>
                <span className="profile-copy"><b>{name}</b><small>רמה {summary.level}</small></span>
                <span className="avatar">{getInitial(name)}</span>
              </button>
            </div>
          </header>

          <section className="welcome-hero">
            <div className="welcome-copy">
              <span className="eyebrow">המסלול האישי שלך</span>
              <h1>שלום {name},<br />מוכנים להתקדם?</h1>
              <p>כל מה שצריך להיום מחכה כאן — לימוד, תרגול, כושר ופרסים.</p>
              <button className="primary-cta" onClick={() => openLegacy(hasEnglish ? 'englishHome' : 'fitness', hasFitness && !hasEnglish ? 'openFitnessHome' : undefined)}>
                המשך מהמקום שעצרתי <span>←</span>
              </button>
            </div>
            <img className="hero-guide" src="./assets/home-guide-cutout.png" alt="אורי, המדריך של מתקדמים" />
            <div className="floating-badge badge-one">⭐ {summary.tasks}/5 למשימה הבאה</div>
            <div className="floating-badge badge-two">🔥 רצף {summary.streak} ימים</div>
          </section>

          <section className="stats-row" aria-label="התקדמות מהירה">
            <article><span className="stat-icon">🪙</span><div><b>{summary.coins}</b><small>מטבעות</small></div></article>
            <article><span className="stat-icon">📚</span><div><b>{summary.words}</b><small>מילים שנלמדו</small></div></article>
            <article><span className="stat-icon">💪</span><div><b>{summary.fitnessLogs}</b><small>אימונים הושלמו</small></div></article>
            <article className="level-stat"><div className="level-line"><b>רמה {summary.level}</b><small>{summary.tasks} מתוך 5</small></div><div className="mini-progress"><i style={{ width: `${summary.progress}%` }} /></div></article>
          </section>

          <div className="section-heading"><div><span>המסלולים שלי</span><h2>מה עושים עכשיו?</h2></div><button onClick={() => openLegacy('progress', 'openProgressArea')}>לכל ההתקדמות ←</button></div>

          <section className={`paths-grid ${hasEnglish !== hasFitness ? 'single' : ''}`}>
            {hasEnglish && (
              <button className="path-card english-card" onClick={() => openLegacy('englishHome')}>
                <div className="path-content"><span className="path-label">אנגלית</span><h3>ממשיכים ללמוד</h3><p>מילים, אותיות, משחקים ומבחן יומי בהתאמה לרמה שלך.</p><span className="path-link">כניסה למסלול ←</span></div>
                <img src="./assets/english-guide-book-cutout.png" alt="מסלול אנגלית" />
              </button>
            )}
            {hasFitness && (
              <button className="path-card fitness-card" onClick={() => openLegacy('fitness', 'openFitnessHome')}>
                <div className="path-content"><span className="path-label">כושר</span><h3>{state.fitness?.configured ? 'האימון הבא מחכה לך' : 'בונים מסלול אישי'}</h3><p>אימונים ברורים וללא ציוד, לפי הגיל, הרמה והימים שבחרת.</p><span className="path-link">כניסה למסלול ←</span></div>
                <img src="./assets/both-fitness-cutout.png" alt="מסלול כושר" />
              </button>
            )}
          </section>

          <section className="quick-actions">
            <button onClick={() => openLegacy('shop', 'renderShop')}><span>🎁</span><b>חדר הפרסים</b><small>לצפייה בפרסים ובהישגים</small></button>
            <button onClick={() => openLegacy('progress', 'openProgressArea')}><span>📈</span><b>ההתקדמות שלי</b><small>כל הנתונים במקום אחד</small></button>
            <button onClick={() => openLegacy('path')}><span>🗺️</span><b>מפת המסלול</b><small>לראות מה כבר נפתח</small></button>
          </section>

          <footer className="home-footer">מתקדמים · גרסה 65</footer>
        </div>
      ) : null}

      <LegacyAppFrame
        ref={legacyRef}
        visible={legacyVisible}
        onRequestModernHome={() => {
          const next = readState();
          setState(next);
          if (next) setLegacyVisible(false);
        }}
      />
    </main>
  );
}
