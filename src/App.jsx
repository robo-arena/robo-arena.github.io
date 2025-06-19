import { useState, useEffect } from 'react';
import MainPage from './components/MainPage.jsx';
import IntroSplash from './components/IntroSplash.jsx';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  /* lock page scrolling while the splash covers it */
  useEffect(() => {
    document.body.classList.toggle('no-scroll', showSplash);
  }, [showSplash]);

  /* small guard: if user reloads while scrolled, skip the splash */
  useEffect(() => {
    if (window.scrollY > 10) setShowSplash(false);
  }, []);

  /* always keep MainPage in the tree; splash is an overlay */
  return (
    <>
      <MainPage />
      {showSplash && <IntroSplash onDone={() => setShowSplash(false)} />}
    </>
  );
}
