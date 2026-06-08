// src/App.jsx
import { useState, useEffect } from 'react';
import { useLocation }         from "react-router-dom";
import MainPage   from './components/MainPage.jsx';
import IntroSplash from './components/IntroSplash.jsx';
import useAutoScale from './useAutoScale.js';
import './App.css';

const MAINTENANCE_MODE = true;

export default function App() {
  return MAINTENANCE_MODE ? <MaintenancePage /> : <RoboArenaApp />;
}

function MaintenancePage() {
  return (
    <main className="maintenance-page" aria-labelledby="maintenance-title">
      <section className="maintenance-shell">
        <img
          src="/robo_arena.png"
          alt="RoboArena boxing robots logo"
          className="maintenance-logo"
        />
        <p className="maintenance-kicker">RoboArena</p>
        <h1 id="maintenance-title">Under Maintenance</h1>
        <p className="maintenance-copy">
          We are updating RoboArena to improve benchmark integrity and transparency.
          The site will be back online soon.
        </p>
        <div className="maintenance-status" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

function RoboArenaApp() {
  useAutoScale(700);

  // Determine if we're on the home page
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  // Show splash on initial home-page load (desktop + mobile)
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
