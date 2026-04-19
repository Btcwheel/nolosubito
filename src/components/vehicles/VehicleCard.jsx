import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Zap } from "lucide-react";
import { motion } from "framer-motion";

const MAKE_FALLBACKS = {
  "Audi": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
  "BMW": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
  "Mercedes": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
  "Tesla": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
  "Volkswagen": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
  "Volvo": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Fiat": "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=80",
  "Peugeot": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  "Ford": "https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&q=80",
  "Renault": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
  "Iveco": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80",
  "Opel": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Citroën": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Citroen": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Toyota": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80",
  "Nissan": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
};

const BRAND_LOGOS = {
  "Audi": "https://www.carlogos.org/car-logos/audi-logo.png",
  "BMW": "https://www.carlogos.org/car-logos/bmw-logo.png",
  "Mercedes": "https://www.carlogos.org/car-logos/mercedes-benz-logo.png",
  "Mercedes-Benz": "https://www.carlogos.org/car-logos/mercedes-benz-logo.png",
  "Tesla": "https://www.carlogos.org/car-logos/tesla-logo.png",
  "Volkswagen": "https://www.carlogos.org/car-logos/volkswagen-logo.png",
  "Volvo": "https://www.carlogos.org/car-logos/volvo-logo.png",
  "Fiat": "https://www.carlogos.org/car-logos/fiat-logo.png",
  "Peugeot": "https://www.carlogos.org/car-logos/peugeot-logo.png",
  "Ford": "https://www.carlogos.org/car-logos/ford-logo.png",
  "Renault": "https://www.carlogos.org/car-logos/renault-logo.png",
  "Opel": "https://www.carlogos.org/car-logos/opel-logo.png",
  "Toyota": "https://www.carlogos.org/car-logos/toyota-logo.png",
  "Nissan": "https://www.carlogos.org/car-logos/nissan-logo.png",
  "Hyundai": "https://www.carlogos.org/car-logos/hyundai-logo.png",
  "Kia": "https://www.carlogos.org/car-logos/kia-logo.png",
  "Citroën": "https://www.carlogos.org/car-logos/citroen-logo.png",
  "Citroen": "https://www.carlogos.org/car-logos/citroen-logo.png",
  "Alfa Romeo": "https://www.carlogos.org/car-logos/alfa-romeo-logo.png",
  "Jeep": "https://www.carlogos.org/car-logos/jeep-logo.png",
  "Land Rover": "https://www.carlogos.org/car-logos/land-rover-logo.png",
  "Porsche": "https://www.carlogos.org/car-logos/porsche-logo.png",
  "Skoda": "https://www.carlogos.org/car-logos/skoda-logo.png",
  "SEAT": "https://www.carlogos.org/car-logos/seat-logo.png",
  "Iveco": "https://www.carlogos.org/car-logos/iveco-logo.png",
};

function BrandLogo({ make }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const logo = BRAND_LOGOS[make];
  const initials = make ? make.slice(0, 2).toUpperCase() : "?";

  if (!logo || imgFailed) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border/50">
        <span className="text-xs font-bold text-muted-foreground">{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 flex items-center justify-center">
      <img
        src={logo}
        alt={make}
        className="w-10 h-10 object-contain"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

const CATEGORY_FALLBACKS = {
  "Commercial Van": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80";

export default function VehicleCard({ vehicle, index }) {
  const fuelIcon = vehicle.fuel_type === "Electric" ? Zap : Fuel;
  const FuelIcon = fuelIcon;
  const fallbackSrc = CATEGORY_FALLBACKS[vehicle.category] || MAKE_FALLBACKS[vehicle.make] || DEFAULT_FALLBACK;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/vehicle/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`}
        state={{ segment: vehicle.segment }}
        className="group block"
      >
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden transition-shadow duration-300 hover:shadow-xl">
          <div className="relative aspect-video bg-muted overflow-hidden">
            <img
              src={vehicle.vehicle_image || fallbackSrc}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={400}
              height={225}
              loading="lazy"
              onError={(e) => { e.target.src = fallbackSrc; }}
            />
            <Badge className="absolute top-3 left-3 bg-electric text-white border-0 text-xs">
              {vehicle.category}
            </Badge>

          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-electric uppercase tracking-wider">{vehicle.make}</p>
              <BrandLogo make={vehicle.make} />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground">
              {vehicle.model}
            </h3>

            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {vehicle.fuel_type && (
                <span className="flex items-center gap-1">
                  <FuelIcon className="w-3.5 h-3.5" />
                  {vehicle.fuel_type}
                </span>
              )}
              {vehicle.power_hp && (
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  {vehicle.power_hp} HP
                </span>
              )}
              {vehicle.transmission && (
                <span>{vehicle.transmission}</span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Da</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-bold text-2xl text-foreground">
                    €{vehicle.monthly_rent?.toLocaleString('it-IT', {minimumFractionDigits: 0})}
                  </span>
                  <span className="text-sm text-muted-foreground">/mese</span>
                </div>
              </div>
              <span className="text-xs text-electric font-semibold group-hover:translate-x-1 transition-transform duration-200">
                Configura →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}