// src/App.jsx
import { useState, useEffect } from 'react';
import { useLocation }         from "react-router-dom";
import MainPage   from './components/MainPage.jsx';
import IntroSplash from './components/IntroSplash.jsx';
import useAutoScale from './useAutoScale.js';

export default function App() {
  useAutoScale(700);

  // 0️⃣  Determine if we're on the home page
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  // 1️⃣  Show splash on initial home-page load (desktop + mobile)
  const [showSplash, setShowSplash] = useState(
    onHome
  );

  /* lock scrolling while splash is up */
  useEffect(() => {
    document.body.classList.toggle('no-scroll', showSplash);
  }, [showSplash]);

  /* skip splash on reload if user is scrolled */
  useEffect(() => {
    if (window.scrollY > 10) setShowSplash(false);
  }, []);

  /* close splash if user navigates off home route */
  useEffect(() => {
    if (!onHome && showSplash) setShowSplash(false);
  }, [onHome, showSplash]);

  return (
    <>
      {showSplash && <IntroSplash onDone={() => setShowSplash(false)} />}

      <div id="zoom-wrapper">
        <MainPage />
      </div>
    </>
  );
}
