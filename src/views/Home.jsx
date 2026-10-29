import React, { useMemo, useRef, useState } from "react";
import FeaturedVehicles from "../components/home/FeaturedVehicles";
import HomeHero from "../components/home/HomeHero";
import BrandIndex from "../components/home/BrandIndex";
import FaqSection from "../components/faq/FaqSection";
import { useFaqs } from "@/hooks/useFaqs";
import { selectHomeFaqs } from "@/lib/faqMatch";

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [budget, setBudget] = useState("all");
  const [advance, setAdvance] = useState("all");
  const [category, setCategory] = useState("all");
  const [make, setMake] = useState("");
  const resultsRef = useRef(null);
  const { data: faqs = [] } = useFaqs();
  const homeFaqs = useMemo(() => selectHomeFaqs(faqs), [faqs]);

  const scrollToResults = () => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Scegliere una marca dall'indice riporta all'elenco già filtrato
  const selectMake = (value) => {
    setMake(value);
    if (value) scrollToResults();
  };

  return (
    <>
      <HomeHero
        searchText={searchText}
        onSearchText={setSearchText}
        budget={budget}
        onBudget={setBudget}
        advance={advance}
        onAdvance={setAdvance}
        category={category}
        onCategory={setCategory}
        onSubmit={scrollToResults}
      />
      <FeaturedVehicles
        searchText={searchText}
        heroBudget={budget}
        heroAdvance={advance}
        heroCategory={category}
        selectedMake={make}
        onSelectMake={setMake}
        resultsRef={resultsRef}
      />
      <BrandIndex selectedMake={make} onSelectMake={selectMake} />
      <div className="bg-[#F8F9FA]">
        <FaqSection
          faqs={homeFaqs}
          title="Tutto quello che c'è da sapere sul noleggio"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14"
        />
      </div>
    </>
  );
}
