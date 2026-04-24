import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function upsertToSupabase(table, records, allowedFields) {
  if (!records || records.length === 0) return { count: 0 };

  const filtered = records.map(r => {
    const obj = {};
    for (const key of allowedFields) {
      if (r[key] !== undefined) obj[key] = r[key];
    }
    return obj;
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(filtered),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert error on table "${table}": ${err}`);
  }

  return { count: records.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [posts, offers] = await Promise.all([
      base44.asServiceRole.entities.Post.list('-created_date', 1000),
      base44.asServiceRole.entities.offers.list('-created_date', 1000),
    ]);

    const postFields = ['id','title','slug','summary','content','cover_image_url','category','published_date','is_published','created_date','updated_date','created_by','created_by_id'];
    const offerFields = ['id','offer_hash','make','model','category','segment','duration_months','annual_km','advance_payment','monthly_rent','vehicle_image','fuel_type','transmission','power_hp','co2_emissions','features','created_date','updated_date','created_by','created_by_id'];

    const results = await Promise.all([
      upsertToSupabase('posts_backup', posts, postFields),
      upsertToSupabase('offers_backup', offers, offerFields),
    ]);

    const summary = {
      timestamp: new Date().toISOString(),
      posts: results[0].count,
      offers: results[1].count,
    };

    return Response.json({ success: true, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});