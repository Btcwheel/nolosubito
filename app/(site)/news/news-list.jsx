"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";
import { PageHeader } from "@/components/layout/ListingLayout";

const CATEGORIES = ["Tutti", "Notizie", "Approfondimenti", "Offerte", "Green Mobility"];

// L'HTML del server contiene tutte le card; il filtro per categoria agisce solo nel browser.
export default function NewsList({ posts }) {
  const [activeCategory, setActiveCategory] = useState("Tutti");
  const filtered = activeCategory === "Tutti" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        eyebrow="Blog & News"
        title="Ultime Notizie"
        description="Approfondimenti, aggiornamenti di settore e novità dal mondo del noleggio a lungo termine."
      />

      <div className="sticky top-16 md:top-20 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer flex-shrink-0 ${
                  activeCategory === cat ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Newspaper className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nessun articolo in questa categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <NewsCard key={post.id} post={post} priority={i < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
