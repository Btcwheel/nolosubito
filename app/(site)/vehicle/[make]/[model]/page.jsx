import { cache } from "react";
import { notFound } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import VehicleDetail from "@/views/VehicleDetail";
import { NowProvider } from "@/lib/NowContext";
import { FAQS_KEY } from "@/hooks/useFaqs";
import { offersService } from "@/services/offers";
import { faqsService } from "@/services/faqs";
import { createServerSupabase } from "@/lib/supabaseServer";
import { fetchSlimCatalog, slimVehicle } from "@/lib/serverCatalog";
import { buildVehicleMeta, buildVehicleJsonLd, jsonLd, vehicleUrl } from "@/lib/vehicleSeo";

// ISR: le schede si generano alla prima richiesta e poi si rigenerano al massimo ogni 5 minuti.
// Se Supabase non risponde la rigenerazione fallisce e resta la versione precedente.
// Veicolo inesistente: 404 vero (non una pagina 200 con "Veicolo non trovato").
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

const decode = (value) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

// Una sola lettura per richiesta: la usano sia generateMetadata sia la pagina.
// L'URL può avere lo slug minuscolo di sitemap e redirect ("abarth"/"500"): getByMakeModel lo risolve.
const loadVehicle = cache(async (make, model) => {
  try {
    return await offersService.getByMakeModel(make, model, createServerSupabase());
  } catch (err) {
    if (err?.code === "NOT_FOUND") return null;
    throw err;
  }
});

const paramsOf = async (params) => {
  const { make, model } = await params;
  return { make: decode(make), model: decode(model) };
};

export async function generateMetadata({ params }) {
  const { make, model } = await paramsOf(params);
  const vehicle = await loadVehicle(make, model);
  if (!vehicle) return { title: "Veicolo non trovato | Nolosubito", robots: { index: false, follow: false } };

  const { title, description } = buildVehicleMeta(vehicle);
  const url = vehicleUrl(vehicle);
  const image = vehicle.vehicle_image || "https://nolosubito.it/og-image.png";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "Nolosubito", locale: "it_IT", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({ params }) {
  const { make, model } = await paramsOf(params);
  const vehicle = await loadVehicle(make, model);
  if (!vehicle) notFound();

  const supabase = createServerSupabase();
  const [configs, faqs, catalog, offersList] = await Promise.all([
    offersService.getConfigs(vehicle.make, vehicle.model, supabase),
    faqsService.listPublished(supabase),
    fetchSlimCatalog(supabase),
    offersService.list(supabase),
  ]);

  // Stessi criteri della vecchia scheda: stessa categoria o stessa marca, al massimo tre.
  const similarVehicles = catalog
    .filter((v) => !(v.make === vehicle.make && v.model === vehicle.model))
    .filter((v) => v.category === vehicle.category || v.make === vehicle.make)
    .slice(0, 3);

  // Le chiavi sono quelle che la vista e QuoteBox/LeadForm leggono, così il browser parte con i dati già presenti.
  const queryClient = new QueryClient();
  queryClient.setQueryData(["offer", make, model], vehicle);
  queryClient.setQueryData(["offer-configs", vehicle.make, vehicle.model], configs);
  queryClient.setQueryData(["offers-list"], offersList.map(slimVehicle));
  queryClient.setQueryData(FAQS_KEY, faqs);

  const [car, breadcrumbs] = buildVehicleJsonLd(vehicle, configs, buildVehicleMeta(vehicle));

  return (
    <NowProvider value={Date.now()}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(car) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VehicleDetail make={make} model={model} similarVehicles={similarVehicles} />
      </HydrationBoundary>
    </NowProvider>
  );
}
