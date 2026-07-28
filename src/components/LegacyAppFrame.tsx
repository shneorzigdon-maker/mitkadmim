import { useEffect, useState } from 'react';

export function LegacyAppFrame() {
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <section className="legacy-host" aria-label="אפליקציית מתקדמים">
      {!online && <div className="network-banner">אין כרגע חיבור לאינטרנט. חלק מהשמירה לענן תתבצע כשהחיבור יחזור.</div>}
      {!loaded && (
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="spinner" />
          <strong>מתקדמים נטען…</strong>
        </div>
      )}
      <iframe
        className={loaded ? 'legacy-frame loaded' : 'legacy-frame'}
        src="./legacy.html"
        title="מתקדמים"
        onLoad={() => setLoaded(true)}
        allow="microphone; camera; autoplay; clipboard-write"
      />
    </section>
  );
}
