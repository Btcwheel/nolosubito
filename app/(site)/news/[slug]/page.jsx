import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabaseServer";
import { fetchPostBySlug } from "@/lib/serverPosts";
import { sanitizeArticleHtml } from "@/lib/sanitizeHtml";
import { formatDateLong } from "@/lib/formatDate";
import NewsCover from "./news-cover";
import NewsGallery from "./news-gallery";

const DOMAIN = "https://nolosubito.it";

// ISR: gli articoli nuovi vengono generati alla prima richiesta e poi rigenerati al massimo ogni 5 minuti.
// Uno slug inesistente risponde 404 vero (non una pagina 200 con "Articolo non trovato").
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

const slugFrom = async (params) => {
  const { slug } = await params;
  try { return decodeURIComponent(slug); } catch { return slug; }
};

// Una sola lettura per richiesta: la usano sia generateMetadata sia la pagina.
const loadPost = cache((slug) => fetchPostBySlug(createServerSupabase(), slug));
const getPost = async (params) => loadPost(await slugFrom(params));

export async function generateMetadata({ params }) {
  const post = await getPost(params);
  if (!post) return { title: "Articolo non trovato | Nolosubito", robots: { index: false, follow: false } };

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.summary || undefined;
  const url = `${DOMAIN}/news/${post.slug}`;
  const image = post.cover_image_url || `${DOMAIN}/og-image.png`;
  const keywords = Array.isArray(post.seo_keywords) ? post.seo_keywords.join(", ") : post.seo_keywords || undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Nolosubito",
      locale: "it_IT",
      publishedTime: post.published_date || post.created_at || undefined,
      modifiedTime: post.updated_at || post.published_date || undefined,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// "<" escapato per non poter chiudere il tag <script> dal contenuto.
const jsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");

export default async function Page({ params }) {
  const post = await getPost(params);
  if (!post) notFound();

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.summary;
  const url = `${DOMAIN}/news/${post.slug}`;
  const gallery = Array.isArray(post.gallery_images) ? post.gallery_images.filter(Boolean) : [];

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title.slice(0, 110),
    description,
    ...(post.cover_image_url && { image: [post.cover_image_url] }),
    datePublished: post.published_date || post.created_at,
    dateModified: post.updated_at || post.published_date,
    inLanguage: "it-IT",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "Nolosubito", url: `${DOMAIN}/` },
    publisher: {
      "@type": "Organization",
      name: "Nolosubito",
      logo: { "@type": "ImageObject", url: `${DOMAIN}/logo-blu.png`, width: 281, height: 78 },
    },
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${DOMAIN}/` },
      { "@type": "ListItem", position: 2, name: "News", item: `${DOMAIN}/news` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background pt-2 sm:pt-4 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-electric transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="size-4" />
          Tutte le Notizie
        </Link>

        <NewsCover src={post.cover_image_url} alt={post.title} />

        <NewsGallery title={post.title} gallery={gallery} />

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
              {formatDateLong(post.published_date)}
            </span>
          )}
        </div>

        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground leading-tight mb-4">
          {post.title}
        </h1>

        {post.summary && (
          <p style={{ borderColor: "#71BAED" }} className="text-lg text-muted-foreground leading-relaxed mb-8 border-l-4 pl-4">
            {post.summary}
          </p>
        )}

        <div className="prose prose-slate max-w-none overflow-x-auto
          prose-headings:font-heading prose-headings:text-foreground
          prose-p:text-foreground/80 prose-p:leading-relaxed
          prose-a:text-electric prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-li:text-foreground/80
          prose-img:rounded-xl
          prose-blockquote:border-l-electric prose-blockquote:text-muted-foreground
        ">
          <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(post.content) }} />
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/news">
              <ArrowLeft className="size-4" />
              Torna alle Notizie
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
