export const MAKE_FALLBACKS = {
  "Audi": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
  "BMW": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
  "Mercedes": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
  "Mercedes-Benz": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
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
  "Hyundai": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Kia": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Alfa Romeo": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
  "Jeep": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Land Rover": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Porsche": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "Skoda": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
  "SEAT": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
};

export const BRAND_LOGOS = {
  "AUDI":           "/brands/audi.svg",
  "BMW":            "/brands/bmw.svg",
  "MERCEDES":       "/brands/mercedes.png",
  "MERCEDES-BENZ":  "/brands/mercedes.png",
  "TESLA":          "/brands/tesla.svg",
  "VOLKSWAGEN":     "/brands/volkswagen.svg",
  "VOLVO":          "/brands/volvo.svg",
  "FIAT":           "/brands/fiat.svg",
  "PEUGEOT":        "/brands/peugeot.svg",
  "FORD":           "/brands/ford.svg",
  "RENAULT":        "/brands/renault.svg",
  "IVECO":          "/brands/iveco.svg",
  "OPEL":           "/brands/opel.svg",
  "CITROËN":        "/brands/citroen.svg",
  "CITROEN":        "/brands/citroen.svg",
  "TOYOTA":         "/brands/toyota.svg",
  "NISSAN":         "/brands/nissan.svg",
  "HYUNDAI":        "/brands/hyundai.svg",
  "KIA":            "/brands/kia.svg",
  "ALFA ROMEO":     "/brands/alfa-romeo.svg",
  "JEEP":           "/brands/jeep.svg",
  "LAND ROVER":     "/brands/landrover.svg",
  "PORSCHE":        "/brands/porsche.svg",
  "SKODA":          "/brands/skoda.svg",
  "SEAT":           "/brands/seat.svg",
  "HONDA":          "/brands/honda.svg",
  "MAZDA":          "/brands/mazda.svg",
  "DACIA":          "/brands/dacia.svg",
  "SUZUKI":         "/brands/suzuki.svg",
  "MITSUBISHI":     "/brands/mitsubishi.svg",
  "LEXUS":          "/brands/lexus.svg",
  "JAGUAR":         "/brands/jaguar.svg",
  "SUBARU":         "/brands/subaru.svg",
  "YAMAHA":         "/brands/yamaha.svg",
  "KAWASAKI":       "/brands/kawasaki.svg",
  "DUCATI":         "/brands/ducati.svg",
  "PIAGGIO":        "/brands/piaggio.svg",
};

export const CATEGORY_FALLBACKS = {
  "Commercial Van": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
};

export const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80";

export function getVehicleImage(vehicle) {
  return vehicle?.vehicle_image
    || CATEGORY_FALLBACKS[vehicle?.category]
    || MAKE_FALLBACKS[vehicle?.make]
    || DEFAULT_FALLBACK;
}

const IMAGE_CROP_POSITIONS = {
  "Alfa Romeo Tonale": "50% 58%",
  "Alfa Romeo": "50% 56%",
  "SUV": "50% 48%",
  "Commercial Van": "50% 50%",
};

export function getVehicleImagePosition(vehicle) {
  const modelKey = `${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`.trim();

  return (
    IMAGE_CROP_POSITIONS[modelKey]
    || IMAGE_CROP_POSITIONS[vehicle?.model]
    || IMAGE_CROP_POSITIONS[vehicle?.category]
    || "50% 50%"
  );
}
