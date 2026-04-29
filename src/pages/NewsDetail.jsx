import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postsService } from "@/services/posts";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function NewsDetail() {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => postsService.getBySlug(slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="aspect-video w-full rounded-2xl mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pt-28 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-4">Articolo non trovato</h1>
          <p className="text-muted-foreground mb-8">L'articolo che cerchi non esiste o è stato rimosso.</p>
          <Link to="/news">
            <Button className="bg-[#71BAED] hover:bg-[#71BAED]/90 text-white">
              Torna alle Notizie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#71BAED] transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Tutte le Notizie
        </Link>

        {/* Cover */}
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-muted">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80";
            }}
          />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.category && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#71BAED] bg-[#71BAED]/10 px-3 py-1.5 rounded-full">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
          )}
          {post.published_date && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(post.published_date), "d MMMM yyyy", { locale: it })}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground leading-tight mb-4">
          {post.title}
        </h1>

        {/* Summary */}
        <p style={{borderColor:'#71BAED'}} className="text-lg text-muted-foreground leading-relaxed mb-8 border-l-4  pl-4">
          {post.summary}
        </p>

        {/* Content */}
        <div className="prose prose-slate max-w-none
          prose-headings:font-heading prose-headings:text-foreground
          prose-p:text-foreground/80 prose-p:leading-relaxed
          prose-a:style={{color:'#71BAED'}} prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-li:text-foreground/80
          prose-img:rounded-xl
          prose-blockquote:style={{borderColor:'#71BAED'}} prose-blockquote:text-muted-foreground
        ">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <Link to="/news">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Torna alle Notizie
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}