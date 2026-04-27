import React from "react";
import { motion, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SCENE_COUNT = 2;

export default function HeroScene({ scene, index, scrollYProgress, isFirst }) {
  const start = index / SCENE_COUNT;
  const end = (index + 1) / SCENE_COUNT;
  const isLast = index === SCENE_COUNT - 1;

  const opacity = useTransform(
    scrollYProgress,
    [
      Math.max(0, start - 0.02),
      start + 0.04,
      end - 0.04,
      Math.min(1, end + 0.02),
    ],
    isFirst && !isLast ? [1, 1, 1, 0]
    : isLast         ? [0, 1, 1, 1]
    :                  [0, 1, 1, 0]
  );

  const imageY     = useTransform(scrollYProgress, [start, end], ["0%", "8%"]);
  const textY      = useTransform(scrollYProgress, [start, end], ["0px", "-20px"]);
  const pointerEvents = useTransform(opacity, (v) => v > 0.1 ? "auto" : "none");

  return (
    <motion.div className="absolute inset-0" style={{ opacity, pointerEvents }}>
      {/* Background parallax */}
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        <img
          src={scene.image}
          alt={scene.label}
          className="w-full h-full object-cover object-center scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D2E82]/65 via-[#2D2E82]/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D2E82]/40 via-transparent to-transparent" />
      </motion.div>

      {/* Text Content */}
      <motion.div
        className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-20"
        style={{ y: textY }}
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <span className="w-6 sm:w-8 h-px bg-electric" />
          <span className="text-electric text-xs sm:text-sm font-semibold tracking-widest uppercase">
            {scene.label}
          </span>
          <span className="text-white/30 text-xs ml-1">{index + 1} / {SCENE_COUNT}</span>
        </div>

        {/* Title — ridotto su mobile per evitare overflow */}
        <h1 className="font-heading font-bold text-4xl sm:text-6xl lg:text-7xl text-white leading-tight whitespace-pre-line drop-shadow-2xl max-w-2xl">
          {scene.title}
        </h1>

        <p className="mt-3 sm:mt-5 text-base sm:text-lg text-white/60 max-w-sm sm:max-w-md leading-relaxed">
          {scene.sub}
        </p>

        {isFirst && (
          <>
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/contact">
                <Button className="w-full sm:w-auto bg-white hover:bg-white/90 text-[#1D2A37] font-semibold px-6 sm:px-8 h-11 sm:h-12 rounded-xl text-sm sm:text-base cursor-pointer">
                  Richiedi Preventivo
                </Button>
              </Link>
              <Link to="/offers">
                <Button variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 font-semibold px-6 sm:px-8 h-11 sm:h-12 rounded-xl text-sm sm:text-base cursor-pointer bg-transparent">
                  Scopri le Offerte
                </Button>
              </Link>
            </div>

            {/* Stats — wrappano su mobile */}
            <div className="mt-8 sm:mt-12 flex flex-wrap gap-x-6 gap-y-3 sm:gap-8">
              {[
                { value: "500+", label: "Contratti attivi" },
                { value: "98%",  label: "Clienti soddisfatti" },
                { value: "24h",  label: "Preventivo" },
              ].map((stat) => (
                <div key={stat.label} className="border-l-2 border-electric/50 pl-3 sm:pl-4">
                  <p className="font-heading font-bold text-xl sm:text-2xl text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
