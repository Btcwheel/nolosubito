export function normalizeVehicleDescription(raw) {
  if (!raw) return "";

  const normalized = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!normalized) return "";

  return normalized
    .split(/\n+/)
    .map((paragraph) => normalizeParagraph(paragraph))
    .filter(Boolean)
    .join("\n\n");
}

export function splitVehicleDescription(raw) {
  const normalized = normalizeVehicleDescription(raw);
  return normalized ? normalized.split(/\n\n+/) : [];
}

function normalizeParagraph(text) {
  let result = String(text).replace(/\s+/g, " ").trim();
  if (!result) return "";

  result = result.replace(/\s+([.,;:!?])/g, "$1");
  result = result.replace(/([.,;:!?])([^\s'"“”‘’])/g, "$1 $2");
  result = result.charAt(0).toUpperCase() + result.slice(1);

  if (!/[.!?…]$/.test(result)) {
    result += ".";
  }

  return result;
}
