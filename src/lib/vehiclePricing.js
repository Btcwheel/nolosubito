export const ADVANCE_BRACKETS = [0, 1500, 2000, 5000, 7500, 10000];

export function formatAdvanceAmount(value) {
  const amount = Number(value) || 0;
  if (amount === 0) return "€0";
  return `€${amount.toLocaleString("it-IT")}`;
}
