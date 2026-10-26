"use client";

import React from "react";
import { Calendar, ArrowRight } from "lucide-react";
import AppLink from "@/lib/AppLink";
import { formatDateShort } from "@/lib/formatDate";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80";

const categoryColors = {
  "Notizie": "bg-blue-100 text-blue-700",
  "Approfondimenti": "bg-purple-100 text-purple-700",
  "Offerte": "bg-green-100 text-green-700",
  "Green Mobility": "bg-emerald-100 text-emerald-700",
  "Azienda": "bg-orange-100 text-orange-700",
};

// Senza animazione d'ingresso: la card deve essere visibile già nell'HTML renderizzato sul server.
export default function NewsCard({ post, priority = false }) {
  return (
    <AppLink to={`/news/${post.slug}`} className="group block h-full">
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={post.cover_image_url || FALLBACK_IMAGE}
            alt={post.title}
            width={800}
            height={450}
            loading={priority ? "eager" : "lazy"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
          />
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-3">
            {post.category && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category] || "bg-muted text-muted-foreground"}`}>
                {post.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Calendar className="size-3" />
              {formatDateShort(post.published_date)}
            </span>
          </div>

          <h3 className="font-heading font-bold text-lg text-foreground leading-snug mb-2 group-hover:text-electric transition-colors duration-200 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed flex-grow line-clamp-3">
            {post.summary}
          </p>

          <div className="flex items-center gap-1 mt-4 text-electric text-sm font-semibold">
            Leggi l'articolo
            <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </AppLink>
  );
}
