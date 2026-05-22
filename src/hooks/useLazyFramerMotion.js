import { useEffect, useState } from 'react';

export function useLazyFramerMotion() {
  const [motion, setMotion] = useState(null);
  const [AnimatePresence, setAnimatePresence] = useState(null);

  useEffect(() => {
    import('framer-motion').then(({ motion: m, AnimatePresence: ap }) => {
      setMotion(() => m);
      setAnimatePresence(() => ap);
    });
  }, []);

  return { motion, AnimatePresence, isLoaded: !!motion };
}
