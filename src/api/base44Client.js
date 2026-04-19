// MIGRATED: Base44 removed. This stub prevents build errors while
// remaining pages are migrated to Supabase in Sprint 3+.
const noop = () => { throw new Error("base44 removed — use Supabase services instead"); };
const makeProxy = () => new Proxy({}, { get: () => makeProxy(), apply: noop });

export const base44 = makeProxy();
