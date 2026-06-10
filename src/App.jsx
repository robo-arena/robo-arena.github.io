// src/App.jsx
import { useState, useEffect } from 'react';
import { useLocation }         from "react-router-dom";
import MainPage   from './components/MainPage.jsx';
import IntroSplash from './components/IntroSplash.jsx';
import useAutoScale from './useAutoScale.js';
import { apiGet } from './api.js';

export default function App() {
  useAutoScale(700);

  // 0️⃣  Determine if we're on the home page
  const { pathname, search } = useLocation();
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

  useEffect(() => {
    const storageKey = 'roboarena_visitor_id';
    let visitorId = window.localStorage.getItem(storageKey);
    if (!visitorId) {
      visitorId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      window.localStorage.setItem(storageKey, visitorId);
    }

    apiGet('/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `${pathname}${search}`,
        referrer: document.referrer || null,
        visitor_id: visitorId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
      }),
    }).catch(() => {});
  }, [pathname, search]);

  return (
    <>
      {showSplash && <IntroSplash onDone={() => setShowSplash(false)} />}

      <div id="zoom-wrapper">
        <MainPage />
      </div>
    </>
  );
}
