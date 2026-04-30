/**
 * ListingLayout — layout condiviso per tutte le pagine di listing veicoli.
 * Implementa il pattern DESIGN.md:
 *   - bg-[#F5F6FA] background
 *   - White page header (pt-28)
 *   - White filter card con native selects
 *   - 3-col grid con gap-5
 *   - Pagination navy
 */
import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// ── Pagination ─────────────────────────────────────────────────────────────
export function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-white cursor-pointer transition-colors"
      >
        ‹
      </button>
      {pages.map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            current === n
              ? "bg-[#2D2E82] text-white"
              : "border border-gray-200 hover:bg-white text-gray-700"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-white cursor-pointer transition-colors"
      >
        ›
      </button>
    </div>
  );
}

// ── NativeSelect ───────────────────────────────────────────────────────────
export function NativeSelect({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 pr-9 focus:outline-none focus:ring-2 focus:ring-[#2D2E82]/20 cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── CardSkeleton ───────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-white border border-[#f1f5f9] rounded-2xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(45,46,130,0.06)]">
      <Skeleton className="h-[200px] w-full" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {eyebrow && (
            <p className="text-xs font-bold text-[#71BAED] uppercase tracking-widest mb-2">{eyebrow}</p>
          )}
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#2D2E82]">{title}</h1>
          {description && (
            <p className="text-gray-500 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">{description}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── FilterBar ──────────────────────────────────────────────────────────────
export function FilterBar({ children, onSearch, searchValue, searchPlaceholder = "Cerca marca o modello…", resultCount }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search sempre come primo elemento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cerca</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E82]/20"
              />
            </div>
          </div>
          {children}
        </div>
      </div>

      {resultCount !== undefined && (
        <div className="flex items-end justify-between mt-6">
          <p className="text-sm text-gray-500">
            Trovati <strong className="text-gray-700">{resultCount}</strong> risultati
          </p>
        </div>
      )}
    </div>
  );
}
