import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type LegacyAppHandle = {
  open: (screen: string, action?: string) => void;
};

type Props = {
  visible: boolean;
  onRequestModernHome: () => void;
};

export const LegacyAppFrame = forwardRef<LegacyAppHandle, Props>(function LegacyAppFrame({ visible, onRequestModernHome }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const run = (screen: string, action?: string) => {
    const win = iframeRef.current?.contentWindow as (Window & Record<string, unknown>) | null;
    if (!win) return;
    try {
      if (action && typeof win[action] === 'function') {
        (win[action] as () => void)();
      }
      if (typeof win.showScreen === 'function') {
        (win.showScreen as (id: string) => void)(screen);
      }
    } catch {
      // The legacy app remains usable even when a named shortcut is unavailable.
    }
  };

  useImperativeHandle(ref, () => ({
    open(screen, action) {
      if (loaded) run(screen, action);
      else window.setTimeout(() => run(screen, action), 700);
    },
  }), [loaded]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data?.type === 'MITKADMIM_MODERN_HOME') onRequestModernHome();
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onRequestModernHome]);

  return (
    <section className={`legacy-host ${visible ? 'visible' : 'hidden-host'}`} aria-label="אפליקציית מתקדמים">
      {!loaded && visible && (
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="spinner" />
          <strong>מתקדמים נטען…</strong>
        </div>
      )}
      <button className="modern-home-button" type="button" onClick={onRequestModernHome} aria-label="חזרה למסך הבית החדש">⌂ בית חדש</button>
      <iframe
        ref={iframeRef}
        className={loaded ? 'legacy-frame loaded' : 'legacy-frame'}
        src="./legacy.html"
        title="מתקדמים"
        onLoad={() => setLoaded(true)}
        allow="microphone; camera; autoplay; clipboard-write"
      />
    </section>
  );
});
