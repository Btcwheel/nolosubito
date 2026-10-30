import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import { getOptimizedSrc } from "@/lib/imageUtils";

// Le cifre 4-0-4 sono disegnate con una griglia 5x7: ogni "X" è una miniatura di un'auto del catalogo.
const GLYPHS = {
  "4": ["...X.", "..XX.", ".X.X.", "X..X.", "XXXXX", "...X.", "...X."],
  "0": [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
};
const ROWS = 7;
const COLS = 17; // 5 + 1 + 5 + 1 + 5

function litCells() {
  const cells = [];
  [...("404")].forEach((digit, i) => {
    GLYPHS[digit].forEach((line, row) => {
      [...line].forEach((ch, col) => {
        if (ch === "X") cells.push(row * COLS + i * 6 + col);
      });
    });
  });
  return cells;
}

// Foto del catalogo attivo, una per modello, in ordine casuale. Se Supabase non risponde la pagina
// resta valida: le tessere diventano riquadri neutri.
async function fetchThumbs(count) {
  try {
    const { data, error } = await createServerSupabase()
      .from("offers")
      .select("make,model,vehicle_image,foto_prev")
      .eq("is_active", true);
    if (error) throw error;
    const seen = new Set();
    const urls = [];
    for (const o of data ?? []) {
      const url = o.vehicle_image || o.foto_prev;
      const key = `${o.make}|${o.model}`;
      if (!url || seen.has(key)) continue;
      seen.add(key);
      urls.push(url);
    }
    for (let i = urls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [urls[i], urls[j]] = [urls[j], urls[i]];
    }
    return urls.slice(0, count);
  } catch {
    return [];
  }
}

export default async function NotFoundPage() {
  const lit = litCells();
  const thumbs = await fetchThumbs(lit.length);
  const tileAt = new Map(lit.map((cell, i) => [cell, i]));

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f1f3ff] via-white to-white">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 text-center sm:pt-16 md:pb-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">Errore 404</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-[#15146c] sm:text-4xl md:text-5xl">
          Questa pagina ha cambiato strada
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          L&apos;indirizzo non esiste più o è stato digitato male. Intanto dai un&apos;occhiata ad alcune delle
          auto che puoi noleggiare con noi.
        </p>

        <div
          role="img"
          aria-label="404"
          className="mx-auto mt-10 grid w-full max-w-4xl gap-[2px] sm:gap-1 md:mt-14 md:gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, auto)` }}
        >
          {Array.from({ length: ROWS * COLS }, (_, cell) => {
            if (!tileAt.has(cell)) return <div key={cell} aria-hidden="true" className="aspect-[4/3]" />;
            const n = tileAt.get(cell);
            const src = thumbs[n];
            return (
              <div
                key={cell}
                aria-hidden="true"
                className="nf-tile aspect-[4/3] overflow-hidden rounded-[3px] border border-slate-200/80 bg-white shadow-sm transition-transform duration-300 hover:z-10 hover:scale-[1.6] hover:shadow-lg sm:rounded-md motion-reduce:transition-none motion-reduce:hover:scale-100"
                style={{ animationDelay: `${n * 28}ms` }}
              >
                {src ? (
                  <img
                    src={getOptimizedSrc(src, 160)}
                    alt=""
                    width="160"
                    height="120"
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-[#e6ebff] to-[#cfe6f8]" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1A1F5E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#15146c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71BAED]"
          >
            Torna alla home
          </Link>
          <Link
            href="/offers"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-[#15146c] transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71BAED]"
          >
            Vedi tutte le offerte
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center px-4 text-sm font-semibold text-electric underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71BAED]"
          >
            Contattaci
          </Link>
        </div>
      </div>
    </section>
  );
}
