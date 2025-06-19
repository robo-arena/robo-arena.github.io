import { useEffect, useRef, useState } from 'react';
import '../css/splash.css';
import introVideo from '../assets/intro.mp4';

export default function IntroSplash({ onDone }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);       // px the splash has moved up
  const full = window.innerHeight;               // one viewport = done

  /* — update the element’s transform — */
  useEffect(() => {
    if (ref.current)
      ref.current.style.transform = `translateY(-${offset}px)`;
  }, [offset]);

  /* — helpers — */
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const scrollBy = (dy) =>
    setOffset(prev => {
      const next = clamp(prev + dy, 0, full);
      if (next >= full) finish();
      return next;
    });

  /* wheel handler (stop native scroll) */
  const wheel = e => {
    e.preventDefault();          // keep page at top
    scrollBy(e.deltaY);
  };

  /* touch-drag handler */
  const lastY = useRef(null);
  const touchMove = e => {
    if (!e.touches.length) return;
    e.preventDefault();          // stop page scrolling
    const y = e.touches[0].clientY;
    if (lastY.current != null) scrollBy(lastY.current - y);
    lastY.current = y;
  };
  const touchEnd = () => (lastY.current = null);

  /* — exit routine (shared by scroll-to-top and timer) — */
  const finish = () => {
    if (ref.current && !ref.current.classList.contains('slide-up'))
      ref.current.classList.add('slide-up');   // animate the last bit
    /* ensure the main page starts at the very top */
    window.scrollTo(0, 0); 
    setTimeout(onDone, 820);                   // wait for transition

    /* clean up listeners */
    window.removeEventListener('wheel', wheel);
    window.removeEventListener('touchmove', touchMove);
    window.removeEventListener('touchend', touchEnd);
  };

  /* — set up listeners + 7-second auto-finish — */
  useEffect(() => {
    const t = setTimeout(finish, 7000);        // auto exit
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', touchEnd);
    return () => {
      clearTimeout(t);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', touchEnd);
    };
  }, []);

  /* — render — */
  return (
    <div className="splash-container" ref={ref}>
      <video
        className="splash-video"
        src={introVideo}
        autoPlay
        muted
        playsInline
      />
      <div className="splash-overlay"></div>
      <h1 className="splash-text">
        <span className="robo">Robo</span>
        <span className="arena">Arena</span>
      </h1>
    </div>
  );
}
