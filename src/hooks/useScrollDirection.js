import { useEffect, useRef, useState } from 'react';

export default function useScrollDirection({ threshold = 4, topOffset = 80 } = {}) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const idleTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => {
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

      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {}, 1000);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer.current);
    };
  }, [threshold, topOffset]);

  return visible;
}
