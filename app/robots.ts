import type { MetadataRoute } from 'next';

const DOMAIN = 'https://nolosubito.it';

// Stesse regole di prima: bloccato meta-externalagent, aree riservate non indicizzabili.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'meta-externalagent', disallow: '/' },
      { userAgent: '*', allow: '/', disallow: ['/admin', '/cms', '/backoffice', '/agente'] },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
  };
}
