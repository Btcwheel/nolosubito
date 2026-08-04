export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const value = email.trim();
  if (!value || value.length > 254) return false;
  if (/\s/.test(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 13) return false;
  const local = digits.startsWith("39") ? digits.slice(2) : digits;
  if (local.length < 9 || local.length > 11) return false;
  return local.startsWith("3") || local.startsWith("0");
}

export function isValidCf(cf) {
  if (!cf || typeof cf !== "string") return false;
  return /^[A-Za-z0-9]{16}$/.test(cf);
}

export function isValidPiva(piva) {
  if (!piva || typeof piva !== "string") return false;
  return /^\d{11}$/.test(piva);
}
