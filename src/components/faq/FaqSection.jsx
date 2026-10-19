import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

// Le risposte arrivano dal CMS come testo semplice: righe con "• " diventano elenco,
// ogni altra riga un paragrafo.
function Answer({ text }) {
  const blocks = [];
  for (const raw of String(text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("•")) {
      const item = line.replace(/^•\s*/, "");
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return (
    <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
      {blocks.map((b, i) =>
        b.type === "list" ? (
          <ul key={i} className="list-disc pl-5 space-y-1 marker:text-electric">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
}

const plain = (text) => String(text ?? "").replace(/^•\s*/gm, "").replace(/\s*\n+\s*/g, " ").trim();

// Fisarmonica con <details>: il testo delle risposte resta sempre nel DOM
// (lo legge anche chi non apre la voce) ed è accessibile da tastiera senza JS.
export default function FaqSection({ faqs, title, eyebrow = "Domande frequenti", intro, className = "" }) {
  if (!faqs?.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: plain(f.answer) },
    })),
  };

  return (
    <section className={className} aria-labelledby="faq-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 lg:gap-12">
        <div>
          <p className="text-xs font-bold text-electric uppercase tracking-widest mb-1">{eyebrow}</p>
          <h2 id="faq-title" className="font-heading font-bold text-2xl sm:text-3xl text-navy">{title}</h2>
          {intro && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{intro}</p>}
          <p className="text-sm text-gray-600 mt-4">
            Non trovi la risposta?{" "}
            <Link to="/contact" className="font-semibold text-navy underline underline-offset-2 hover:text-electric transition-colors">
              Scrivici
            </Link>
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map(f => (
            <details key={f.id} className="group bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(26,31,94,0.04)] open:shadow-[0_6px_20px_-12px_rgba(26,31,94,0.25)] transition-shadow">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 rounded-2xl [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/60">
                <span className="font-semibold text-[15px] text-navy leading-snug">{f.question}</span>
                <ChevronDown className="size-4 shrink-0 text-navy/50 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <Answer text={f.answer} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
