// Date in italiano con fuso fisso: server (UTC) e browser danno lo stesso testo, senza errori di idratazione.
const base = { timeZone: "Europe/Rome" };
const short = new Intl.DateTimeFormat("it-IT", { ...base, day: "numeric", month: "short", year: "numeric" });
const long = new Intl.DateTimeFormat("it-IT", { ...base, day: "numeric", month: "long", year: "numeric" });

export const formatDateShort = (value) => (value ? short.format(new Date(value)) : "");
export const formatDateLong = (value) => (value ? long.format(new Date(value)) : "");
