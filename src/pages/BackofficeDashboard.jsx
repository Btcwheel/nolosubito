import React from "react";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

// Placeholder — verrà sviluppato nel Sprint 3
export default function BackofficeDashboard() {
  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto text-center py-20"
      >
        <div className="w-16 h-16 rounded-2xl bg-electric/10 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-electric" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard Backoffice</h1>
        <p className="text-muted-foreground mt-2">In sviluppo — Sprint 3</p>
      </motion.div>
    </div>
  );
}
