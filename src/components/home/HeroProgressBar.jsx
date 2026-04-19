import React from "react";
import { motion, useTransform } from "framer-motion";

const SCENE_COUNT = 5;

function ProgressDot({ index, scrollYProgress }) {
  const start = index / SCENE_COUNT;
  const end = (index + 1) / SCENE_COUNT;
  const height = useTransform(scrollYProgress, [start, end], ["0%", "100%"]);

  return (
    <div className="w-1 h-8 rounded-full bg-white/20 overflow-hidden">
      <motion.div className="w-full bg-electric rounded-full" style={{ height }} />
    </div>
  );
}

export default function HeroProgressBar({ scrollYProgress }) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
      {Array.from({ length: SCENE_COUNT }).map((_, i) => (
        <ProgressDot key={i} index={i} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}