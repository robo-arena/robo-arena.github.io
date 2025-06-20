import { useLayoutEffect } from 'react';

export default function useAutoScale(designWidth = 800) {
  useLayoutEffect(() => {
    function setScale() {
      const scale = Math.min(1, window.innerWidth / designWidth);
      document.documentElement.style.setProperty('--app-scale', scale);
    }
    setScale();                        // run once
    window.addEventListener('resize', setScale);
    return () => window.removeEventListener('resize', setScale);
  }, [designWidth]);
}
