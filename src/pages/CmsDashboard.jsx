import React, { useState } from "react";
import { Car, Newspaper, Tag, FolderOpen } from "lucide-react";
import CmsVehicles from "./CmsVehicles.jsx";
import CmsOffers from "./CmsOffers.jsx";
import CmsNews from "./CmsNews.jsx";
import CmsMateriali from "./CmsMateriali.jsx";

const TABS = [
  { id: "vehicles",  label: "Veicoli",    icon: Car,        desc: "Catalogo auto con foto e dettagli" },
  { id: "prices",    label: "Prezzi",     icon: Tag,        desc: "Configurazioni canoni QuoteBox" },
  { id: "news",      label: "News",       icon: Newspaper,  desc: "Articoli e notizie pubbliche" },
  { id: "materiali", label: "Materiali",  icon: FolderOpen, desc: "Documenti per gli agenti" },
];

export default function CmsDashboard() {
  const [tab, setTab] = useState("vehicles");

  return (
    <div className="min-h-screen bg-background pb-16 px-4 pt-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground">CMS</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestione contenuti del sito Nolosubito</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "vehicles"  && <CmsVehicles />}
        {tab === "prices"    && <CmsOffers />}
        {tab === "news"      && <CmsNews />}
        {tab === "materiali" && <CmsMateriali />}
      </div>
    </div>
  );
}