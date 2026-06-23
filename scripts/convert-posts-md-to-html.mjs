// One-shot script per convertire il contenuto dei post da Markdown a HTML
// Uso: node scripts/convert-posts-md-to-html.mjs
// Richiede: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY nel .env

import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Mancano VITE_SUPABASE_URL e/o VITE_SUPABASE_SERVICE_KEY nel .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Caricamento post...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content');

  if (error) {
    console.error('Errore caricamento post:', error);
    process.exit(1);
  }

  let converted = 0;

  for (const post of posts) {
    if (!post.content || post.content.trim().startsWith('<')) {
      continue; // già HTML
    }

    const html = await marked.parse(post.content);

    const { error: updateError } = await supabase
      .from('posts')
      .update({ content: html })
      .eq('id', post.id);

    if (updateError) {
      console.error(`Errore aggiornamento post ${post.id}:`, updateError);
    } else {
      converted++;
      console.log(`✓ Convertito post ${post.id}`);
    }
  }

  console.log(`\nFatto! ${converted}/${posts.length} post convertiti.`);
}

main().catch(console.error);
