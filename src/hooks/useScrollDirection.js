import { useEffect, useRef, useState } from 'react';

export default function useScrollDirection({ threshold = 4, topOffset = 80 } = {}) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const idleTimer = useRef(null);

  useEffect(() => {
    let rafId = null;

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const y = window.scrollY;

        if (y < topOffset) {
          setVisible(true);
          lastY.current = y;
          return;
        }

        const delta = y - lastY.current;
        if (Math.abs(delta) > threshold) {
          setVisible(delta < 0);
          lastY.current = y;
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [threshold, topOffset]);

  return visible;
}
