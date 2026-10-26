"use client";

import BusinessOffers from "@/views/BusinessOffers";
import PrivateOffers from "@/views/PrivateOffers";
import CommercialOffers from "@/views/CommercialOffers";
import MotoOffers from "@/views/MotoOffers";
import ReuseOffers from "@/views/ReuseOffers";
import GreenMobility from "@/views/GreenMobility";

// Confini client delle liste: le viste sono quelle della SPA, qui vengono prima renderizzate sul server.
export const VIEWS = {
  business: BusinessOffers,
  private: PrivateOffers,
  commercial: CommercialOffers,
  moto: MotoOffers,
  reuse: ReuseOffers,
  green: GreenMobility,
};

export function ListingView({ name }) {
  const View = VIEWS[name];
  return <View />;
}
