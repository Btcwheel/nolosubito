import { offersService } from "@/services/offers";

// Campi che le liste e le card non usano: descrizioni, gallerie e SEO pesano circa il 60% del catalogo
// e non devono finire nell'HTML delle pagine renderizzate sul server.
const HEAVY_FIELDS = ["description", "gallery_images", "features", "seo_description", "seo_title", "seo_keywords"];

export function slimVehicle(vehicle) {
  const slim = { ...vehicle };
  for (const field of HEAVY_FIELDS) delete slim[field];
  return slim;
}

export async function fetchSlimCatalog(client, segments) {
  return (await offersService.listWithMinPrice(segments, client)).map(slimVehicle);
}
