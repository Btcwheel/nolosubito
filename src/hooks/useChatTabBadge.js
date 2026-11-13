import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const FAVICON_SRC = "/favicon.png";

// Suono breve (due toni) generato al volo: nessun file audio da caricare.
// I browser tengono l'audio bloccato finché l'utente non interagisce con la pagina: un suono
// avviato prima restava "in pausa" e partiva solo al primo clic (es. aprendo la scheda Chat Luca).
// Per questo l'AudioContext si sblocca al primo clic/tasto e, se è ancora bloccato, il suono
// si salta (resta la notifica desktop) invece di arrivare in ritardo.
let audioCtx = null;
const AUDIO_STATE_EVENT = "chat-audio-state";

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
    audioCtx.onstatechange = () => window.dispatchEvent(new Event(AUDIO_STATE_EVENT));
  }
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
}

// L'AudioContext può tornare "suspended" anche dopo lo sblocco (Mac in stop, cambio cuffie/casse,
// Chrome che sospende l'audio della pagina). Se la pagina ha già avuto un clic, Chrome consente di
// riprenderlo senza un nuovo clic: si prova resume() e si aspetta al massimo 1,5 secondi.
async function ensureRunning() {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state !== "running") {
    await Promise.race([ctx.resume().catch(() => {}), new Promise((res) => setTimeout(res, 1500))]);
  }
  return ctx.state === "running" ? ctx : null;
}

/** Stato del suono per l'interfaccia: true se gli avvisi possono suonare. */
export function useChatSoundReady() {
  const [ready, setReady] = useState(() => audioCtx?.state === "running");
  useEffect(() => {
    const update = () => setReady(audioCtx?.state === "running");
    update();
    window.addEventListener(AUDIO_STATE_EVENT, update);
    return () => window.removeEventListener(AUDIO_STATE_EVENT, update);
  }, []);
  return ready;
}

// Nuova chat: il doppio tono si ripete 4 volte (circa 3 secondi) per farsi sentire anche da lontano.
// Nuovo messaggio del cliente: un solo doppio tono, per non disturbare durante la conversazione.
const CHIME_REPEATS = 4;
const CHIME_GAP_SECONDS = 0.8;

export async function playChime(high = false, repeats = 1) {
  try {
    const ctx = await ensureRunning();
    if (!ctx) {
      console.warn("[chat] suono non riprodotto: audio del browser bloccato (serve un clic nella pagina)");
      return;
    }
    for (let i = 0; i < repeats; i++) {
      const t = ctx.currentTime + i * CHIME_GAP_SECONDS;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(high ? 880 : 660, t);
      osc.frequency.setValueAtTime(high ? 660 : 520, t + 0.1);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  } catch { /* audio non disponibile: resta la notifica */ }
}

function showDesktopNotification(title, body, tag, { sticky = false } = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    // sticky: la notifica resta a schermo finché l'operatore non la chiude (nuova chat in attesa).
    const n = new Notification(title, {
      body: body?.slice(0, 120) ?? "",
      icon: "/favicon.png",
      tag,
      requireInteraction: sticky,
      silent: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* alcuni browser non permettono new Notification: resta il suono */ }
}

function isTabActive() {
  return document.visibilityState === "visible" && document.hasFocus();
}

// Disegna il favicon con un pallino rosso in alto a destra (stile WhatsApp Web).
function buildBadgedFavicon(callback) {
  const img = new Image();
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size - 20, 20, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    callback(canvas.toDataURL("image/png"));
  };
  img.src = FAVICON_SRC;
}

/**
 * Avvisi chat per backoffice/admin, attivi su qualsiasi scheda della dashboard:
 * - nuova chat in attesa (Luca sospeso o escalation): suono + notifica desktop, sempre;
 * - nuovo messaggio del cliente: suono + notifica solo se la tab non è in primo piano;
 * - pallino sul favicon e "(N)" nel titolo finché la tab non torna in primo piano.
 * Prima suono e notifica erano solo nel pannello Escalation: se l'operatore stava su
 * un'altra scheda (es. Pratiche) le chat dirette arrivavano senza alcun avviso.
 */
export function useChatTabBadge(enabled) {
  useEffect(() => {
    if (!enabled) return;

    const baseTitle = document.title;
    const link = document.querySelector("link[rel~='icon']");
    const originalHref = link?.getAttribute("href") ?? FAVICON_SRC;
    let badgedHref = null;
    let unread = 0;
    let blinkTimer = null;
    let blinkOn = true;
    // Le escalation vengono create con upsert: possono arrivare come INSERT o UPDATE.
    // Conto ogni sessione una sola volta finché resta in "waiting".
    const waitingIds = new Set();

    buildBadgedFavicon((url) => {
      badgedHref = url;
      paintFavicon();
    });

    function paintFavicon() {
      if (!link) return;
      const showBadge = unread > 0 && badgedHref && blinkOn;
      link.setAttribute("href", showBadge ? badgedHref : originalHref);
    }

    // Il favicon lampeggia (badge/icona normale) finché ci sono messaggi non letti.
    function render() {
      document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
      if (unread > 0 && !blinkTimer) {
        blinkOn = true;
        blinkTimer = setInterval(() => { blinkOn = !blinkOn; paintFavicon(); }, 800);
      } else if (unread === 0 && blinkTimer) {
        clearInterval(blinkTimer);
        blinkTimer = null;
      }
      blinkOn = true;
      paintFavicon();
    }

    function bump() {
      if (isTabActive()) return;
      unread += 1;
      render();
    }

    function clear() {
      if (unread === 0 || !isTabActive()) return;
      unread = 0;
      render();
    }

    function notifyWaiting(row) {
      if (waitingIds.has(row.id)) return;
      waitingIds.add(row.id);
      const isDirect = row.source === "direct";
      playChime(isDirect, CHIME_REPEATS);
      showDesktopNotification(
        isDirect ? "Nuova chat in arrivo" : "Luca ha bisogno di aiuto",
        row.user_question,
        `chat-${row.id}`,
        { sticky: true },
      );
      bump();
    }

    // Rete di sicurezza: se il websocket è caduto (tab in background, rete, sospensione del Mac)
    // un evento può andare perso. Ogni 20 secondi si rilegge l'elenco delle chat in attesa e si
    // avvisa per quelle non ancora viste. Il primo giro registra le chat già presenti senza suonare.
    let seeded = false;
    let cancelled = false;
    async function pollWaiting() {
      const { data, error } = await supabase
        .from("escalated_sessions")
        .select("id, source, status, user_question")
        .eq("status", "waiting")
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled || error || !data) return;
      const current = new Set(data.map((r) => r.id));
      for (const id of [...waitingIds]) if (!current.has(id)) waitingIds.delete(id);
      if (!seeded) {
        data.forEach((r) => waitingIds.add(r.id));
        seeded = true;
        return;
      }
      data.forEach(notifyWaiting);
    }
    pollWaiting();
    const pollTimer = setInterval(pollWaiting, 20000);

    const channel = supabase
      .channel("tab_badge_chat")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "escalated_sessions" },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          if (row.status !== "waiting") { waitingIds.delete(row.id); return; }
          notifyWaiting(row);
        })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "operator_chat_messages" },
        (payload) => {
          if (payload.new?.sender !== "customer") return;
          if (!isTabActive()) {
            playChime();
            showDesktopNotification("Nuovo messaggio in chat", payload.new?.content, `msg-${payload.new?.session_id}`);
          }
          bump();
        })
      .subscribe();

    document.addEventListener("visibilitychange", clear);
    window.addEventListener("focus", clear);
    // Qualsiasi clic o tasto nella dashboard sblocca l'audio per gli avvisi successivi.
    const unlockEvents = ["pointerdown", "mousedown", "keydown", "touchstart"];
    unlockEvents.forEach((ev) => window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", clear);
      window.removeEventListener("focus", clear);
      unlockEvents.forEach((ev) => window.removeEventListener(ev, unlockAudio, { capture: true }));
      supabase.removeChannel(channel);
      unread = 0;
      render();
    };
  }, [enabled]);
}
