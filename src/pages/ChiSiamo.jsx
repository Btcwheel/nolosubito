import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TITLE = "Chi siamo | Nolosubito";
const DESCRIPTION =
  "Nolosubito S.r.l. è una piattaforma italiana di noleggio a lungo termine per privati, partite IVA e aziende, con sede a Napoli.";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="font-heading font-semibold text-lg text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function ChiSiamo() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (created) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const prevDescription = meta.getAttribute("content");
    meta.setAttribute("content", DESCRIPTION);

    return () => {
      document.title = prevTitle;
      if (created) meta.parentNode?.removeChild(meta);
      else meta.setAttribute("content", prevDescription ?? "");
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Torna al sito
        </Link>

        <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Chi siamo</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Nolosubito S.r.l. · Via Nuova Poggioreale, 60L · 80143 Napoli · P.IVA IT08350931211
        </p>

        <Section title="Cos'è Nolosubito">
          <p>
            Nolosubito è una piattaforma italiana di noleggio a lungo termine (NLT) di auto, veicoli
            commerciali e moto, pensata per privati, titolari di partita IVA e aziende.
          </p>
          <p>
            Il canone mensile è all-inclusive e il preventivo si richiede online, con consulenza rapida
            e condizioni chiare.
          </p>
        </Section>

        <Section title="Cosa trovi sul sito">
          <ul className="list-disc pl-5 space-y-1">
            <li><Link to="/offers" className="text-electric hover:underline">Offerte per aziende e P.IVA</Link></li>
            <li><Link to="/private-offers" className="text-electric hover:underline">Offerte per privati</Link></li>
            <li><Link to="/commercial" className="text-electric hover:underline">Veicoli commerciali</Link></li>
            <li><Link to="/moto" className="text-electric hover:underline">Moto e scooter</Link></li>
            <li><Link to="/fleet" className="text-electric hover:underline">Soluzioni per flotte aziendali</Link></li>
            <li><Link to="/green" className="text-electric hover:underline">Mobilità green</Link></li>
            <li><Link to="/usato" className="text-electric hover:underline">Usato e Reuse</Link></li>
          </ul>
        </Section>

        <Section title="Contatti">
          <p>
            Email: <a href="mailto:info@nolosubito.it" className="text-electric hover:underline">info@nolosubito.it</a>
            <br />
            Telefono: <a href="tel:+390640049490" className="text-electric hover:underline">+39 06 4004 9490</a>
          </p>
          <p>
            Per un preventivo vai alla pagina <Link to="/contact" className="text-electric hover:underline">Contattaci</Link>.
          </p>
        </Section>
      </div>
    </div>
  );
}
