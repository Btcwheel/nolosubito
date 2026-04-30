import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-heading font-semibold text-lg text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Torna al sito
        </Link>

        <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <Section title="1. Titolare del Trattamento">
          <p>
            Il Titolare del trattamento dei dati personali è <strong>Nolosubito S.r.l.</strong>,
            con sede legale in Milano (MI), Italia — email:{" "}
            <a href="mailto:privacy@nolosubito.it" className="text-electric hover:underline">privacy@nolosubito.it</a>.
          </p>
        </Section>

        <Section title="2. Dati Raccolti">
          <p>Raccogliamo le seguenti categorie di dati personali:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li><strong>Dati di contatto:</strong> nome, cognome, indirizzo email, numero di telefono</li>
            <li><strong>Dati aziendali:</strong> ragione sociale, Partita IVA (se applicabile)</li>
            <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, durata della visita</li>
            <li><strong>Dati della chat:</strong> conversazioni con l'assistente virtuale, esigenze espresse</li>
            <li><strong>Dati dei documenti:</strong> documenti caricati nell'area riservata per la pratica di noleggio</li>
          </ul>
        </Section>

        <Section title="3. Finalità e Base Giuridica del Trattamento">
          <p>I dati vengono trattati per le seguenti finalità:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li><strong>Erogazione del servizio</strong> (esecuzione del contratto): gestione delle pratiche di noleggio, comunicazioni operative</li>
            <li><strong>Richieste di preventivo e contatto</strong> (legittimo interesse / consenso): elaborazione delle richieste ricevute tramite form o chat</li>
            <li><strong>Adempimenti legali</strong> (obbligo di legge): fatturazione, adempimenti fiscali e contabili</li>
            <li><strong>Marketing</strong> (consenso): invio di offerte, newsletter e comunicazioni promozionali — solo previo consenso esplicito</li>
            <li><strong>Miglioramento del servizio</strong> (legittimo interesse): analisi statistica anonima del traffico e delle interazioni</li>
          </ul>
        </Section>

        <Section title="4. Cookie">
          <p>Il sito utilizza cookie tecnici (necessari al funzionamento) e cookie analitici/di marketing (solo con consenso).</p>
          <p className="mt-2">Puoi modificare le tue preferenze in qualsiasi momento cliccando su "Gestisci cookie" nel footer o reimpostando le preferenze dal tuo browser.</p>
          <p className="mt-2">Per informazioni dettagliate sui cookie utilizzati, consulta la nostra <Link to="/cookie-policy" className="text-electric hover:underline">Cookie Policy</Link>.</p>
        </Section>

        <Section title="5. Conservazione dei Dati">
          <p>I dati vengono conservati per i tempi strettamente necessari alle finalità per cui sono stati raccolti:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li>Dati contrattuali: 10 anni dalla conclusione del rapporto (obbligo di legge)</li>
            <li>Dati di lead e preventivi: 24 mesi dall'ultimo contatto</li>
            <li>Dati della chat: 12 mesi</li>
            <li>Dati di navigazione (log): 12 mesi</li>
          </ul>
        </Section>

        <Section title="6. Condivisione dei Dati">
          <p>I dati non vengono venduti a terzi. Possono essere comunicati a:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li>Società finanziarie partner (esclusivamente per la valutazione del credito, previo consenso)</li>
            <li>Fornitori di servizi tecnici (hosting, database, email) che agiscono come Responsabili del Trattamento</li>
            <li>Autorità competenti in caso di obbligo di legge</li>
          </ul>
          <p className="mt-2">I dati vengono trattati all'interno dell'Unione Europea. Eventuali trasferimenti extra-UE avvengono nel rispetto delle garanzie previste dal GDPR.</p>
        </Section>

        <Section title="7. I Tuoi Diritti (GDPR)">
          <p>In qualità di interessato, hai diritto a:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li><strong>Accesso:</strong> ottenere conferma del trattamento e copia dei tuoi dati</li>
            <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
            <li><strong>Cancellazione ("diritto all'oblio"):</strong> richiedere la cancellazione dei tuoi dati</li>
            <li><strong>Limitazione:</strong> richiedere la limitazione del trattamento in determinati casi</li>
            <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato e leggibile</li>
            <li><strong>Opposizione:</strong> opporti al trattamento basato su legittimo interesse o per finalità di marketing</li>
            <li><strong>Revoca del consenso:</strong> revocare in qualsiasi momento il consenso prestato</li>
          </ul>
          <p className="mt-2">
            Per esercitare i tuoi diritti scrivi a{" "}
            <a href="mailto:privacy@nolosubito.it" className="text-electric hover:underline">privacy@nolosubito.it</a>.
            Hai inoltre diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-electric hover:underline">garanteprivacy.it</a>).
          </p>
        </Section>

        <Section title="8. Sicurezza">
          <p>
            Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati da accessi non autorizzati,
            perdita o divulgazione. I dati sono conservati su infrastruttura cloud con crittografia in transito (TLS)
            e a riposo.
          </p>
        </Section>

        <Section title="9. Modifiche alla Privacy Policy">
          <p>
            Ci riserviamo il diritto di aggiornare questa informativa. Le modifiche sostanziali saranno comunicate
            tramite avviso sul sito. La versione aggiornata è sempre disponibile a questo indirizzo.
          </p>
        </Section>

        <div className="border-t border-border/40 pt-6 mt-4">
          <p className="text-xs text-muted-foreground">
            Nolosubito S.r.l. — P.IVA IT12345678901 — Milano, Italia
          </p>
        </div>
      </div>
    </div>
  );
}
