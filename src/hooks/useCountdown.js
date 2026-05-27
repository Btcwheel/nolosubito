import { useState, useEffect } from "react";

function calcRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  const totalMs = diff;
  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds, expired: false, totalMs };
}

export function useCountdown(expiresAt) {
  const [state, setState] = useState(() =>
    expiresAt ? calcRemaining(expiresAt) : null
  );

  useEffect(() => {
    if (!expiresAt) return;
    setState(calcRemaining(expiresAt));
    const id = setInterval(() => setState(calcRemaining(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return state;
}
