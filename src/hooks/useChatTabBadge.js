import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const FAVICON_SRC = "/favicon.png";

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
    ctx.arc(size - 16, 16, 15, 0, 2 * Math.PI);
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
 * Mostra sulla tab del browser un pallino sul favicon e un contatore nel titolo
 * "(N) ..." quando arrivano nuove chat o nuovi messaggi cliente e la tab non è
 * in primo piano. Si azzera appena l'operatore torna sulla tab.
 */
export function useChatTabBadge(enabled) {
  useEffect(() => {
    if (!enabled) return;

    const baseTitle = document.title;
    const link = document.querySelector("link[rel~='icon']");
    const originalHref = link?.getAttribute("href") ?? FAVICON_SRC;
    let badgedHref = null;
    let unread = 0;

    buildBadgedFavicon((url) => {
      badgedHref = url;
      if (unread > 0 && link) link.setAttribute("href", url);
    });

    function render() {
      document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
      if (link) link.setAttribute("href", unread > 0 && badgedHref ? badgedHref : originalHref);
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
        { event: "INSERT", schema: "public", table: "escalated_sessions" },
        (payload) => { if (payload.new?.status === "waiting") bump(); })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "operator_chat_messages" },
        (payload) => { if (payload.new?.sender === "customer") bump(); })
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
