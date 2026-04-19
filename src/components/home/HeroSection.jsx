import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroScene from "./HeroScene";
import HeroProgressBar from "./HeroProgressBar";

const SCENES = [
  {
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&q=90&auto=format&fit=crop",
    label: "Il Tuo Veicolo",
    title: "Guida il Tuo\nSogno",
    sub: "Noleggio a lungo termine per privati, P.IVA e flotte aziendali.",
  },
  {
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&q=90&auto=format&fit=crop",
    label: "Motore",
    title: "Potenza\nSenza Limiti",
    sub: "Scegli tra centinaia di motorizzazioni. Benzina, diesel, ibrido, elettrico.",
  },
  {
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=90&auto=format&fit=crop",
    label: "Su Strada",
    title: "Comfort\ndi Guida",
    sub: "Veicoli sempre in perfetto stato. Manutenzione inclusa nel canone mensile.",
  },
  {
    image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1920&q=90&auto=format&fit=crop",
    label: "Design",
    title: "Stile\nItaliano",
    sub: "Berlina, SUV, van commerciali. Il veicolo giusto per ogni esigenza.",
  },
  {
    image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1920&q=90&auto=format&fit=crop",
    label: "Interni",
    title: "Ogni Dettaglio\nCurato",
    sub: "Interni premium, tecnologia di bordo, comfort totale per ogni km.",
  },
];

// Su mobile: 3 scene (300vh), su desktop: 5 scene (500vh)
const isMobile = () => window.innerWidth < 640;

export default function HeroSection() {
  const containerRef = useRef(null);
  const mobile = isMobile();
  const activeScenes = mobile ? SCENES.slice(0, 3) : SCENES;
  const totalHeight = activeScenes.length * 100;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <div ref={containerRef} style={{ height: `${totalHeight}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {activeScenes.map((scene, i) => (
          <HeroScene
            key={i}
            scene={scene}
            index={i}
            scrollYProgress={scrollYProgress}
            isFirst={i === 0}
            totalScenes={activeScenes.length}
          />
        ))}

        <HeroProgressBar scrollYProgress={scrollYProgress} />

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: scrollHintOpacity }}
        >
          <span className="text-white/40 text-[10px] sm:text-xs tracking-widest uppercase">
            Scorri per esplorare
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
