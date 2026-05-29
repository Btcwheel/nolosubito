import React, { useState } from "react";
import { postsService } from "@/services/posts";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import NewsCard from "@/components/news/NewsCard";
import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/layout/ListingLayout";

const CATEGORIES = ["Tutti", "Notizie", "Approfondimenti", "Offerte", "Green Mobility", "Azienda"];

export default function News() {
  const [activeCategory, setActiveCategory] = useState("Tutti");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => postsService.list({ onlyPublished: true }),
  });

  const filtered = activeCategory === "Tutti"
    ? posts
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        eyebrow="Blog & News"
        title="Ultime Notizie"
        description="Approfondimenti, aggiornamenti di settore e novità dal mondo del noleggio a lungo termine."
      />

      {/* Category Filter */}
      <div className="sticky top-16 md:top-20 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer flex-shrink-0 ${
                  activeCategory === cat
                    ? "bg-navy text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Newspaper className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Nessun articolo in questa categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <NewsCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}