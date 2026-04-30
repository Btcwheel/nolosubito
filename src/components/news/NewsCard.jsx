import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";

export default function NewsCard({ post, index = 0 }) {
  const categoryColors = {
    "Notizie": "bg-blue-100 text-blue-700",
    "Approfondimenti": "bg-purple-100 text-purple-700",
    "Offerte": "bg-green-100 text-green-700",
    "Green Mobility": "bg-emerald-100 text-emerald-700",
    "Azienda": "bg-orange-100 text-orange-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/news/${post.slug}`} className="group block h-full">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          {/* Cover Image */}
          <div className="aspect-video overflow-hidden bg-muted">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80";
              }}
            />
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-grow">
            <div className="flex items-center gap-2 mb-3">
              {post.category && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category] || "bg-muted text-muted-foreground"}`}>
                  {post.category}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Calendar className="w-3 h-3" />
                {post.published_date
                  ? format(new Date(post.published_date), "d MMM yyyy", { locale: it })
                  : ""}
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
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}