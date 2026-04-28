import React from "react";
import HeroSection from "../components/home/HeroSection";
import BrandMarquee from "../components/home/BrandMarquee";
import FeaturedVehicles from "../components/home/FeaturedVehicles";
import WhySection from "../components/home/WhySection";
import SocialProof from "../components/home/SocialProof";

export default function Home() {
  return (
    <>
      <HeroSection variant="compact" />
      <FeaturedVehicles />
      <WhySection />
      <BrandMarquee />
      <SocialProof />
    </>
  );
}
