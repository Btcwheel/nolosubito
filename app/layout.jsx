import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/index.css";

// Font self-hosted da next/font (niente richiesta a Google Fonts). Le variabili sono lette da index.css.
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], display: "swap", variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", variable: "--font-space-grotesk" });

export const metadata = {
  metadataBase: new URL("https://nolosubito.it"),
  title: "Nolosubito | Noleggio Lungo Termine - Aziende e Privati",
  description:
    "NoloSubito: soluzioni premium di noleggio lungo termine per Aziende, P.IVA e Privati. Canone all-inclusive trasparente, auto nuove e zero pensieri. Richiedi un preventivo veloce.",
  icons: { icon: "/favicon.png" },
  alternates: { types: { "application/rss+xml": [{ url: "https://nolosubito.it/feed.xml", title: "Nolosubito News" }] } },
  openGraph: {
    title: "Nolosubito | Noleggio Lungo Termine - Aziende e Privati",
    description: "Scopri le migliori offerte di Noleggio Lungo Termine per Aziende e Privati. Preventivi veloci e canoni trasparenti.",
    type: "website",
    url: "https://nolosubito.it/",
    siteName: "Nolosubito",
    locale: "it_IT",
    images: ["https://nolosubito.it/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nolosubito | Noleggio Lungo Termine - Aziende e Privati",
    description: "Scopri le migliori offerte di Noleggio Lungo Termine per Aziende e Privati.",
    images: ["https://nolosubito.it/og-image.png"],
  },
};

export const viewport = { width: "device-width", initialScale: 1 };

const ORGANIZATION_JSON_LD = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://nolosubito.it/#organization","name":"Nolosubito","legalName":"Nolosubito S.r.l.","url":"https://nolosubito.it/","logo":{"@type":"ImageObject","url":"https://nolosubito.it/logo-blu.png","width":281,"height":78},"vatID":"IT08350931211","sameAs":["https://www.facebook.com/nolosubito","https://www.instagram.com/nolosubito.it/","https://www.linkedin.com/company/nolosubito-it/","https://it.trustpilot.com/review/nolosubito.it"],"email":"info@nolosubito.it","telephone":"+39 06 4004 9490","address":{"@type":"PostalAddress","streetAddress":"Via Nuova Poggioreale, 60L","postalCode":"80143","addressLocality":"Napoli","addressCountry":"IT"},"contactPoint":[{"@type":"ContactPoint","contactType":"customer service","telephone":"+39 06 4004 9490","email":"info@nolosubito.it","areaServed":"IT","availableLanguage":"it"}]},{"@type":"WebSite","@id":"https://nolosubito.it/#website","url":"https://nolosubito.it/","name":"Nolosubito","inLanguage":"it-IT","publisher":{"@id":"https://nolosubito.it/#organization"}}]};

// Google Consent Mode v2: "denied" finché l'utente non sceglie dal banner cookie.
const CONSENT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
window.__updateConsent = (prefs) => {
  gtag('consent', 'update', {
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
  });
};`;

// GA4 caricato alla prima interazione (o dopo 8s) per proteggere LCP/TBT su mobile.
const ANALYTICS_SCRIPT = `
(function () {
  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  let started = false;
  const loadAnalytics = () => {
    if (started) return;
    started = true;
    events.forEach((e) => window.removeEventListener(e, loadAnalytics));
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-KVKGSKMKLK';
    script.async = true;
    document.head.appendChild(script);
    gtag('js', new Date());
    gtag('config', 'G-KVKGSKMKLK');
  };
  events.forEach((e) => window.addEventListener(e, loadAnalytics, { once: true, passive: true }));
  setTimeout(loadAnalytics, 8000);
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }} />
        <link rel="preconnect" href="https://nowoiywrzfnjocvsbmih.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://nowoiywrzfnjocvsbmih.supabase.co" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <Script id="consent-mode" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: CONSENT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Script id="ga4-loader" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: ANALYTICS_SCRIPT }} />
      </body>
    </html>
  );
}
