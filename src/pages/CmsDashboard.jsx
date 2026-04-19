import React, { useState } from "react";
import { Car, Newspaper, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CmsOffers from "./CmsOffers.jsx";
import CmsNews from "./CmsNews.jsx";

const TABS = [
  { id: "offers", label: "Offerte Veicoli", icon: Car },
  { id: "news", label: "News & Articoli", icon: Newspaper },
];

export default function CmsDashboard() {
  const [tab, setTab] = useState("offers");

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">CMS</h1>
            <p className="text-muted-foreground mt-1">Gestione contenuti: offerte veicoli, news e articoli</p>
          </div>
          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "offers" && <CmsOffers />}
        {tab === "news" && <CmsNews />}
      </div>
    </div>
  );
}