import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-heading font-semibold text-lg text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Torna al sito
        </Link>

        <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <Section title="1. Cosa sono i cookie">
          <p>
            I cookie sono piccoli file di testo che il sito salva sul tuo dispositivo durante la navigazione,
            per far funzionare correttamente le pagine, ricordare le tue preferenze e raccogliere statistiche
            d'uso in forma aggregata.
          </p>
        </Section>

        <Section title="2. Come gestiamo il consenso">
          <p>
            Alla prima visita ti mostriamo un banner che ti permette di accettare tutti i cookie, accettare
            solo quelli necessari, oppure personalizzare le tue preferenze categoria per categoria. I cookie
            non necessari (analitici e di marketing) vengono attivati solo dopo una tua scelta esplicita.
          </p>
          <p className="mt-2">
            Puoi modificare la tua scelta in qualsiasi momento cliccando su{" "}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))}
              className="text-electric hover:underline cursor-pointer"
            >
              "Gestisci cookie"
            </button>{" "}
            nel footer del sito.
          </p>
        </Section>

        <Section title="3. Categorie di cookie utilizzate">
          <ul className="list-disc list-inside space-y-2 mt-2 ml-2">
            <li>
              <strong>Necessari:</strong> indispensabili per il funzionamento del sito (es. salvataggio delle
              preferenze di consenso, sicurezza, sessione). Non richiedono consenso e non possono essere disattivati.
            </li>
            <li>
              <strong>Analitici:</strong> ci permettono di capire come viene usato il sito, in forma aggregata
              e anonima, per migliorarne i contenuti e le prestazioni. Attivi solo previo consenso.
            </li>
            <li>
              <strong>Marketing:</strong> utilizzati per mostrare contenuti pubblicitari pertinenti. Attivi
              solo previo consenso.
            </li>
          </ul>
        </Section>

        <Section title="4. Servizi di terze parti">
          <p>Sul sito è attivo il seguente servizio di terze parti, soggetto a consenso:</p>
          <ul className="list-disc list-inside space-y-2 mt-2 ml-2">
            <li>
              <strong>Google Analytics 4</strong> (Google Ireland Ltd.) — cookie analitici per la misurazione
              del traffico in forma aggregata. Si attiva solo se acconsenti alla categoria "Analitici"
              (gestito tramite Google Consent Mode). Informativa del fornitore:{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-electric hover:underline">
                policies.google.com/privacy
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="5. Durata dei cookie">
          <p>
            La tua preferenza di consenso viene conservata sul tuo dispositivo per 12 mesi, dopodiché il
            banner verrà mostrato nuovamente. I cookie di Google Analytics, quando attivi, hanno una durata
            massima di 14 mesi secondo le impostazioni di Google.
          </p>
        </Section>

        <Section title="6. Maggiori informazioni">
          <p>
            Per i dettagli sul trattamento dei tuoi dati personali consulta la nostra{" "}
            <Link to="/privacy" className="text-electric hover:underline">Privacy Policy</Link>. Per domande
            sulla gestione dei cookie scrivi a{" "}
            <a href="mailto:privacy@nolosubito.it" className="text-electric hover:underline">privacy@nolosubito.it</a>.
          </p>
        </Section>

        <div className="border-t border-border/40 pt-6 mt-4">
          <p className="text-xs text-muted-foreground">
            Nolosubito S.r.l. — P.IVA IT08350931211 — Napoli, Italia
          </p>
        </div>
      </div>
    </div>
  );
}
