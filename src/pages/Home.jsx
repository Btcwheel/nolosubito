import React, { useRef, useState } from "react";
import FeaturedVehicles from "../components/home/FeaturedVehicles";
import HomeHero from "../components/home/HomeHero";

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [budget, setBudget] = useState("all");
  const [advance, setAdvance] = useState("all");
  const [category, setCategory] = useState("all");
  const resultsRef = useRef(null);

  const scrollToResults = () => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
        resultsRef={resultsRef}
      />
    </>
  );
}
