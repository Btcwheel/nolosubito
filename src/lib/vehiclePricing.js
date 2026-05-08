export const ADVANCE_BRACKETS = [0, 1500, 2000, 5000, 7500, 10000];
export const VAT_RATE = 0.22;

export function formatAdvanceAmount(value) {
  const amount = Number(value) || 0;
  if (amount === 0) return "€0";
  return `€${amount.toLocaleString("it-IT")}`;
}

export function resolvePricingSegment({ segment, vehicleCategory, vehicleSegments = [] } = {}) {
  if (segment) return segment;

  const segments = Array.isArray(vehicleSegments) ? vehicleSegments : [];
  const hasPiva = segments.includes("P.IVA");
  const hasPrivati = segments.includes("Privati");

  if (vehicleCategory === "Moto e Scooter") {
    return "Moto";
  }

  if (hasPiva && !hasPrivati) return "P.IVA";
  if (hasPrivati && !hasPiva) return "Privati";
  if (hasPiva) return "P.IVA";
  if (hasPrivati) return "Privati";
  return null;
}

export function isVatIncludedForDisplay({ segment, vehicleCategory, vehicleSegments = [] } = {}) {
  if (segment === "Moto" && vehicleCategory === "Moto e Scooter" && vehicleSegments.includes("Privati")) {
    return false;
  }

  const resolvedSegment = resolvePricingSegment({ segment, vehicleCategory, vehicleSegments });
  return resolvedSegment === "Privati" || resolvedSegment === "Moto";
}

export function formatDisplayedRent(rent, options = {}) {
  const amount = Number(rent);
  if (!Number.isFinite(amount)) return null;
  return Math.round(isVatIncludedForDisplay(options) ? amount * (1 + VAT_RATE) : amount);
}
