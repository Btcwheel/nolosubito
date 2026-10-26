import { VercelRequest, VercelResponse } from '@vercel/node';

const DOMAIN = "https://nolosubito.it";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const domain = process.env.VITE_APP_URL || process.env.APP_URL || DOMAIN;

  const robots = `User-agent: meta-externalagent
Disallow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /cms
Disallow: /backoffice
Disallow: /agente

Sitemap: ${domain}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(robots);
}
