import React from "react";
import HeroSection from "../components/home/HeroSection";
import WhySection from "../components/home/WhySection";
import FeaturedVehicles from "../components/home/FeaturedVehicles";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedVehicles />
      <WhySection />
    </>
  );
}