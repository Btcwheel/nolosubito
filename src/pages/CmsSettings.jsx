import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, Image as ImageIcon, Globe, Share2, Save, Eye } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SITE_IMAGES_BUCKET = "site-images";

// ── Helper: upload immagine su site-images ────────────────────────────────────
async function uploadSiteImage(file, prefix) {
  const ext = file.name.split(".").pop();
  const path = `${prefix}-${Date.now()}.${ext}`.toLowerCase().replace(/\s+/g, "-");

  const { error: uploadError } = await supabase.storage
    .from(SITE_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Image Upload con preview ──────────────────────────────────────────────────
function ImageUpload({ label, description, value, onChange, accept = "image/*", recommendedSize }) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadSiteImage(file, label.toLowerCase().replace(/\s+/g, "-"));
      onChange(url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {recommendedSize && <p className="text-[10px] text-muted-foreground">Dimensione consigliata: {recommendedSize}</p>}

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer text-sm font-medium transition-colors border border-border">
            <Upload className="size-4" />
            {uploading ? "Caricamento..." : "Scegli immagine"}
            <input type="file" accept={accept} onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
        </div>
        {preview && (
          <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-border shrink-0">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { onChange(""); setPreview(null); }}
              className="absolute top-1 right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {uploading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Upload in corso...
        </div>
      )}
    </div>
  );
}

// ── Preview anteprima social (Facebook/LinkedIn) ──────────────────────────────
function SocialPreview({ title, description, imageUrl }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card max-w-[500px]">
      <div className="aspect-[1.91/1] bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="OG Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            <ImageIcon className="size-8 opacity-30" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide truncate">NOLOSUBITO.IT</p>
        <p className="text-sm font-semibold text-foreground line-clamp-1">{title || "Titolo non impostato"}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{description || "Descrizione non impostata"}</p>
      </div>
    </div>
  );
}

// ── Preview snippet Google ────────────────────────────────────────────────────
function GooglePreview({ title, description, url }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card max-w-[500px]">
      <p className="text-xs text-[#202124] truncate mb-0.5">{url || "https://nolosubito.it"}</p>
      <p className="text-lg text-[#1a0dab] font-medium line-clamp-1 hover:underline cursor-pointer">{title || "Titolo non impostato"}</p>
      <p className="text-sm text-[#4d5156] line-clamp-2">{description || "Descrizione non impostata"}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CmsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Carica impostazioni esistenti
  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["seo_homepage", "hero_image"]);
      if (error) throw error;

      const map = {};
      data?.forEach((row) => { map[row.key] = row.value; });
      return map;
    },
  });

  // Popola i campi quando i dati arrivano
  useEffect(() => {
    if (!settings) return;
    const seo = settings.seo_homepage || {};
    setSeoTitle(seo.title || "");
    setSeoDescription(seo.description || "");
    setOgImageUrl(seo.og_image_url || "");
    const hero = settings.hero_image || {};
    setHeroImageUrl(hero.url || "");
  }, [settings]);

  // Salva impostazioni
  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        // Salva SEO homepage
        supabase
          .from("site_settings")
          .upsert(
            { key: "seo_homepage", value: { title: seoTitle, description: seoDescription, og_image_url: ogImageUrl } },
            { onConflict: "key" }
          ),
        // Salva Hero image
        supabase
          .from("site_settings")
          .upsert(
            { key: "hero_image", value: { url: heroImageUrl } },
            { onConflict: "key" }
          )
      ]);

      queryClient.invalidateQueries(["site-settings"]);
      toast({ title: "Impostazioni salvate", description: "Le modifiche sono state applicate con successo." });
    } catch (err) {
      console.error("Save failed:", err);
      toast({ title: "Errore", description: "Impossibile salvare le impostazioni.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        Caricamento impostazioni...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Impostazioni Sito</h2>
          <p className="text-sm text-muted-foreground mt-1">SEO, Open Graph e immagini globali</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-electric hover:bg-electric/90 text-white">
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Salva Modifiche
        </Button>
      </div>

      {/* ── Sezione SEO & Social ──────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="size-5 text-electric" />
          <h3 className="font-semibold text-foreground">SEO & Open Graph (Social)</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="seo-title">Titolo SEO / OG Title</Label>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Nolosubito | Noleggio Lungo Termine"
                maxLength={60}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{seoTitle.length}/60 caratteri</p>
            </div>

            <div>
              <Label htmlFor="seo-description">Descrizione SEO / OG Description</Label>
              <Textarea
                id="seo-description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Scopri le migliori offerte di Noleggio Lungo Termine..."
                maxLength={160}
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{seoDescription.length}/160 caratteri</p>
            </div>

            <ImageUpload
              label="Immagine Open Graph"
              description="Immagine mostrata quando il sito viene condiviso su Facebook, LinkedIn, WhatsApp, ecc."
              value={ogImageUrl}
              onChange={setOgImageUrl}
              recommendedSize="1200×630px (ratio 1.91:1)"
            />
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Eye className="size-3.5" />
              Anteprima
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">Facebook / LinkedIn / WhatsApp</p>
              <SocialPreview title={seoTitle} description={seoDescription} imageUrl={ogImageUrl} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">Google Search</p>
              <GooglePreview title={seoTitle} description={seoDescription} url="https://nolosubito.it" />
            </div>
          </div>
        </div>
      </div>

      {/* ─ Sezione Hero Homepage ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="size-5 text-electric" />
          <h3 className="font-semibold text-foreground">Hero Homepage</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <ImageUpload
              label="Immagine Hero"
              description="Immagine di sfondo della sezione hero nella homepage. Sostituisce l'immagine da Unsplash."
              value={heroImageUrl}
              onChange={setHeroImageUrl}
              recommendedSize="1280×533px o superiore"
            />
            {heroImageUrl && (
              <p className="text-[10px] text-muted-foreground break-all">
                URL: {heroImageUrl}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Eye className="size-3.5" />
              Anteprima Hero
            </div>
            <div className="relative w-full aspect-[1280/533] rounded-xl overflow-hidden border border-border bg-muted">
              {heroImageUrl ? (
                <img src={heroImageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                  <ImageIcon className="size-8 opacity-30" />
                  <span>Nessuna immagine impostata</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-lg drop-shadow-md">Noleggiamo il Futuro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
