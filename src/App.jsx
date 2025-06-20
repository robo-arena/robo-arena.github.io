// src/App.jsx
import { useState, useEffect } from 'react';
import MainPage   from './components/MainPage.jsx';
import IntroSplash from './components/IntroSplash.jsx';
import useAutoScale from './useAutoScale.js';

const PHONE_MAX = 1200;   // px – your cutoff

export default function App() {
  useAutoScale(700);

  // 1️⃣  Initial decision: show splash only if not phone-sized
  const [showSplash, setShowSplash] = useState(
    window.innerWidth >= PHONE_MAX
  );

  /* lock scrolling while splash is up */
  useEffect(() => {
    document.body.classList.toggle('no-scroll', showSplash);
  }, [showSplash]);

  /* skip splash on reload if user is scrolled */
  useEffect(() => {
    if (window.scrollY > 10) setShowSplash(false);
  }, []);

  /* 2️⃣  While splash is visible, dismiss it on window resize */
  useEffect(() => {
    if (!showSplash) return;             // listener only active when needed
    function handleResize() {
      if (window.innerWidth < PHONE_MAX) setShowSplash(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSplash]);

  return (
    <>
      {showSplash && <IntroSplash onDone={() => setShowSplash(false)} />}

      <div id="zoom-wrapper">
        <MainPage />
      </div>
    </>
  );
}
