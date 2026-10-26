"use client";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80";

// Copertina con immagine di riserva se l'URL non risponde.
export default function NewsCover({ src, alt }) {
  return (
    <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-muted">
      <img
        src={src || FALLBACK_IMAGE}
        alt={alt}
        width={1200}
        height={675}
        fetchPriority="high"
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
      />
    </div>
  );
}
