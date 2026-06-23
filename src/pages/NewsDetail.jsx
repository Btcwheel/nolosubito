import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postsService } from "@/services/posts";
import { ArrowLeft, Calendar, Tag, ChevronLeft, ChevronRight, X } from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

function useNoIndex(active) {
  useEffect(() => {
    if (!active) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, [active]);
}

function useSeoMeta(post) {
  useEffect(() => {
    if (!post) return;

    const prevTitle = document.title;
    document.title = post.seo_title || post.title;

    const setMeta = (name, content, attr = "name") => {
      if (!content) return null;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      const created = !el;
      if (created) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
      return created ? el : null;
    };

    const desc = post.seo_description || post.summary;
    const keywords = Array.isArray(post.seo_keywords)
      ? post.seo_keywords.join(", ")
      : typeof post.seo_keywords === "string"
        ? post.seo_keywords
        : "";

    const created = [
      setMeta("description", desc),
      setMeta("keywords", keywords),
      setMeta("og:title", post.seo_title || post.title, "property"),
      setMeta("og:description", desc, "property"),
      post.cover_image_url ? setMeta("og:image", post.cover_image_url, "property") : null,
    ].filter(Boolean);

    return () => {
      document.title = prevTitle;
      created.forEach(el => el.parentNode?.removeChild(el));
    };
  }, [post]);
}

export default function NewsDetail() {
  const { slug } = useParams();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => postsService.getBySlug(slug),
  });

  const gallery = post?.gallery_images || [];

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  }, [gallery.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  }, [gallery.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, handlePrev, handleNext]);

  useNoIndex(!isLoading && !post);
  useSeoMeta(post);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-2 sm:pt-4 pb-16">
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
      <div className="min-h-screen bg-background pt-2 sm:pt-4 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-4">Articolo non trovato</h1>
          <p className="text-muted-foreground mb-8">L'articolo che cerchi non esiste o è stato rimosso.</p>
          <Link to="/news">
            <Button className="bg-electric hover:bg-electric/90 text-white">
              Torna alle Notizie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-2 sm:pt-4 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-electric transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="size-4" />
          Tutte le Notizie
        </Link>

        {/* Cover */}
        <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-muted">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80";
            }}
          />
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gallery.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-video rounded-xl overflow-hidden bg-muted group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
                >
                  <img
                    src={url}
                    alt={`${post.title} - foto ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={lightboxIndex !== null} onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}>
          <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none">
            <div className="relative flex items-center justify-center w-full h-full">
              <img
                src={gallery[lightboxIndex]}
                alt={`${post?.title} - foto ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain p-4"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    aria-label="Foto precedente"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    aria-label="Foto successiva"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                    {lightboxIndex + 1} / {gallery.length}
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

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.category && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-electric bg-electric/10 px-3 py-1.5 rounded-full">
              <Tag className="size-3" />
              {post.category}
            </span>
          )}
          {post.published_date && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
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
          prose-a:text-electric prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-li:text-foreground/80
          prose-img:rounded-xl
          prose-blockquote:border-l-electric prose-blockquote:text-muted-foreground
        ">
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <Link to="/news">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Torna alle Notizie
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
