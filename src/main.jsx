import '@/index.css'

// Entry minimale: l'app (React, Supabase, router...) parte solo dopo che il browser ha
// dipinto il guscio hero di index.html. Il JS pesante altrimenti occupa il main thread
// prima del primo paint e l'LCP dipende da una gara con l'esecuzione degli script.
// Il CSS resta importato qui per restare nell'<head> (niente flash senza stile).
let started = false;
const start = () => {
  if (started) return;
  started = true;
  import('./bootstrap.jsx');
};

const shellImg = document.querySelector('#hero-shell img');
const heroReady =
  shellImg && !shellImg.complete
    ? new Promise((resolve) => {
        shellImg.addEventListener('load', resolve, { once: true });
        shellImg.addEventListener('error', resolve, { once: true });
      })
    : Promise.resolve();

// Doppio rAF = almeno un frame dipinto. Il timeout copre tab in background (rAF sospeso)
// e reti lente (immagine hero che non arriva).
heroReady.then(() => requestAnimationFrame(() => requestAnimationFrame(start)));
setTimeout(start, 3000);
