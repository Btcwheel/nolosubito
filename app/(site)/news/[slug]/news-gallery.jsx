"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

// Galleria foto dell'articolo con lightbox (frecce da tastiera incluse).
export default function NewsGallery({ title, gallery }) {
  const [index, setIndex] = useState(null);

  const prev = useCallback(() => setIndex((i) => (i === 0 ? gallery.length - 1 : i - 1)), [gallery.length]);
  const next = useCallback(() => setIndex((i) => (i === gallery.length - 1 ? 0 : i + 1)), [gallery.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, prev, next]);

  if (!gallery.length) return null;

  return (
    <>
      <div className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {gallery.map((url, i) => (
            <button
              type="button"
              key={url}
              onClick={() => setIndex(i)}
              className="aspect-video rounded-xl overflow-hidden bg-muted group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
            >
              <img
                src={url}
                alt={`${title} - foto ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={index !== null} onOpenChange={(open) => { if (!open) setIndex(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center w-full h-full">
            <img
              src={gallery[index ?? 0]}
              alt={`${title} - foto ${(index ?? 0) + 1}`}
              className="max-w-full max-h-full object-contain p-4"
            />
            {gallery.length > 1 && (
              <>
                <button type="button" onClick={prev} aria-label="Foto precedente" className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={next} aria-label="Foto successiva" className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors">
                  <ChevronRight className="size-6" />
                </button>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                  {(index ?? 0) + 1} / {gallery.length}
                </span>
              </>
            )}
          </div>
          <DialogClose className="absolute top-2 right-2 size-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors">
            <X className="size-4" />
            <span className="sr-only">Chiudi</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
