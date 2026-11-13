import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const FAVICON_SRC = "/favicon.png";

// Suono breve (due toni) generato al volo: nessun file audio da caricare.
let audioCtx = null;
function playChime(high = false) {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(high ? 880 : 660, ctx.currentTime);
    osc.frequency.setValueAtTime(high ? 660 : 520, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* audio non disponibile: resta la notifica */ }
}

function showDesktopNotification(title, body, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body: body?.slice(0, 120) ?? "", icon: "/favicon.png", tag });
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

    const channel = supabase
      .channel("tab_badge_chat")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "escalated_sessions" },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          if (row.status !== "waiting") { waitingIds.delete(row.id); return; }
          if (waitingIds.has(row.id)) return;
          waitingIds.add(row.id);
          const isDirect = row.source === "direct";
          playChime(isDirect);
          showDesktopNotification(
            isDirect ? "Nuova chat in arrivo" : "Luca ha bisogno di aiuto",
            row.user_question,
            `chat-${row.id}`,
          );
          bump();
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

    return () => {
      document.removeEventListener("visibilitychange", clear);
      window.removeEventListener("focus", clear);
      supabase.removeChannel(channel);
      unread = 0;
      render();
    };
  }, [enabled]);
}
