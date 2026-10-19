// Risponde 410 Gone agli URL del vecchio sito WordPress che non hanno una pagina equivalente.
// Un redirect verso /offers o /news verrebbe classificato da Google come soft 404.
// Raggiunta dai rewrite di vercel.json generati da scripts/generate-legacy-redirects.mjs.
const HTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Pagina non più disponibile | Nolosubito</title>
</head>
<body>
  <h1>Pagina non più disponibile</h1>
  <p>Questa pagina è stata rimossa.</p>
  <a href="https://nolosubito.it/">Torna alla home</a>
</body>
</html>`;

function gone() {
  return new Response(HTML, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  });
}

export const GET = gone;
export const HEAD = gone;
