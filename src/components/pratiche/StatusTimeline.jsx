import React from "react";
import { Check, Clock, FileText, ThumbsUp, Truck, Archive } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { label: "Nuova", icon: Clock },
  { label: "In Lavorazione", icon: FileText },
  { label: "Documenti Richiesti", icon: FileText },
  { label: "Approvata", icon: ThumbsUp },
  { label: "Consegnata", icon: Truck },
  { label: "Chiusa", icon: Archive },
];

export default function StatusTimeline({ currentStatus }) {
  const currentIndex = STEPS.findIndex(s => s.label === currentStatus);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start min-w-max sm:min-w-0 gap-0">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === STEPS.length - 1;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <motion.div
                  initial={false}
                  animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.6, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? "style={{backgroundColor:'#71BAED'}} style={{borderColor:'#71BAED'}}"
                      : isCurrent
                        ? "bg-white style={{borderColor:'#71BAED'}} shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                        : "bg-white border-border"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#71BAED]" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-border/60" />
                  )}
                </motion.div>

                {/* Label */}
                <p className={`mt-2 text-center leading-tight px-1 transition-all duration-200 ${
                  isCurrent
                    ? "font-semibold style={{color:'#71BAED'}} text-xs"
                    : isDone
                      ? "text-muted-foreground text-xs"
                      : "text-muted-foreground/40 text-xs"
                }`} style={{ fontSize: "0.62rem", maxWidth: 72 }}>
                  {step.label}
                </p>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex-1 mx-1 h-0.5 relative -mt-5">
                  <div className="w-full h-full bg-border/40 rounded-full" />
                  {isDone && (
                    <motion.div
                      className="absolute inset-0 bg-[#71BAED] rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4 }}
                      style={{ transformOrigin: "left" }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}