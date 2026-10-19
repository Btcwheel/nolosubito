import SpaClient from "./spa-client";

// Hero shell: h1 e sottotitolo nell'HTML per LCP e per i crawler senza JS. Stesso layout dell'hero React
// (HomeHero), che lo rimuove quando monta. Il CSS è inline perché serve prima del bundle.
const SHELL_CSS = `
#hero-shell{position:absolute;top:0;left:0;right:0;z-index:40;pointer-events:none;background:#F8F9FA;color:#1A1F5E;padding-top:64px;font-family:'Inter',sans-serif}
#hero-shell .hs-wrap{max-width:80rem;margin:0 auto;padding:40px 16px 56px}
#hero-shell h1{margin:0;font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:36px;line-height:1.05;letter-spacing:-.03em;color:#1A1F5E}
#hero-shell p{margin:20px 0 0;max-width:28rem;color:#475569;font-size:18px;line-height:28px;font-weight:500}
@media(min-width:640px){#hero-shell .hs-wrap{padding-left:24px;padding-right:24px}#hero-shell h1{font-size:48px}}
@media(min-width:768px){#hero-shell{padding-top:80px}}
@media(min-width:1024px){#hero-shell .hs-wrap{padding:56px 32px 64px}#hero-shell .hs-txt{max-width:41.6667%}}
@media(min-width:1280px){#hero-shell h1{font-size:60px}}`;

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <div id="hero-shell">
        <div className="hs-wrap">
          <div className="hs-txt">
            <h1>Noleggiamo il Futuro</h1>
            <p>Canone chiaro, tutto incluso: zero pensieri, dovrai solo pensare a guidare.</p>
          </div>
        </div>
      </div>
      <SpaClient />
    </>
  );
}
