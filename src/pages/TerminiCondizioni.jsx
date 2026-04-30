import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-heading font-semibold text-lg text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TerminiCondizioni() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Torna al sito
        </Link>

        <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Termini e Condizioni</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <Section title="1. Accettazione dei Termini">
          <p>
            L'accesso e l'utilizzo del sito web <strong>nolosubito.it</strong> e dei servizi correlati
            implica l'accettazione integrale dei presenti Termini e Condizioni. Se non accetti questi termini,
            ti invitiamo a non utilizzare il sito.
          </p>
        </Section>

        <Section title="2. Descrizione del Servizio">
          <p>
            Nolosubito è una piattaforma che facilita la ricerca e la sottoscrizione di contratti di
            noleggio a lungo termine di veicoli per privati, titolari di Partita IVA e aziende.
          </p>
          <p>
            Il sito fornisce informazioni sulle offerte disponibili, consente di richiedere preventivi
            e mette in contatto gli utenti con i nostri consulenti specializzati. La sottoscrizione
            definitiva del contratto di noleggio avviene separatamente, tra il cliente e la società
            di leasing/noleggio prescelta.
          </p>
        </Section>

        <Section title="3. Utilizzo del Sito">
          <p>L'utente si impegna a:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li>Fornire informazioni veritiere e aggiornate nei form di contatto e preventivo</li>
            <li>Non utilizzare il sito per scopi illeciti o contrari all'ordine pubblico</li>
            <li>Non tentare di accedere a aree riservate senza autorizzazione</li>
            <li>Non effettuare operazioni che possano compromettere la sicurezza o il funzionamento del sito</li>
          </ul>
        </Section>

        <Section title="4. Preventivi e Offerte">
          <p>
            I prezzi e le offerte pubblicati sul sito sono indicativi e soggetti a variazioni in base
            alla disponibilità, al profilo del cliente e alle condizioni della società finanziaria.
            Il preventivo definitivo e vincolante viene fornito dal consulente assegnato.
          </p>
          <p>
            La visualizzazione di un'offerta sul sito non costituisce un impegno contrattuale da parte
            di Nolosubito.
          </p>
        </Section>

        <Section title="5. Area Riservata">
          <p>
            L'accesso all'area riservata è subordinato alla creazione di un account o all'utilizzo
            di un link personale fornito da Nolosubito. L'utente è responsabile della riservatezza
            delle proprie credenziali di accesso.
          </p>
          <p>
            Nolosubito si riserva il diritto di sospendere o disattivare l'accesso in caso di
            utilizzo non autorizzato o violazione dei presenti termini.
          </p>
        </Section>

        <Section title="6. Proprietà Intellettuale">
          <p>
            Tutti i contenuti del sito (testi, immagini, loghi, grafica, codice) sono di proprietà
            di Nolosubito S.r.l. o dei rispettivi titolari e sono protetti dalle leggi sul diritto
            d'autore. È vietata la riproduzione, distribuzione o modifica senza autorizzazione scritta.
          </p>
        </Section>

        <Section title="7. Limitazione di Responsabilità">
          <p>
            Nolosubito non è responsabile per eventuali danni diretti o indiretti derivanti dall'utilizzo
            del sito, da interruzioni del servizio, da errori nelle informazioni pubblicate o da
            decisioni prese sulla base dei contenuti del sito.
          </p>
          <p>
            Il sito può contenere link a siti di terze parti. Nolosubito non è responsabile del
            contenuto o delle pratiche privacy di tali siti.
          </p>
        </Section>

        <Section title="8. Modifiche ai Termini">
          <p>
            Nolosubito si riserva il diritto di modificare i presenti Termini in qualsiasi momento.
            Le modifiche entrano in vigore dalla data di pubblicazione sul sito. L'uso continuato
            del sito dopo la pubblicazione delle modifiche costituisce accettazione delle stesse.
          </p>
        </Section>

        <Section title="9. Legge Applicabile e Foro Competente">
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia relativa
            all'utilizzo del sito è competente il Foro di Milano, salvo diversa previsione di legge
            a tutela dei consumatori.
          </p>
        </Section>

        <div className="border-t border-border/40 pt-6 mt-4">
          <p className="text-xs text-muted-foreground">
            Nolosubito S.r.l. — P.IVA IT08350931211 — Napoli, Italia —{" "}
            <Link to="/privacy" className="text-electric hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
