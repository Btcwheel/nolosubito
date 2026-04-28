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

const WV = "https://cdn.worldvectorlogo.com/logos";

export const BRAND_LOGOS = {
  "Audi":           `${WV}/audi.svg`,
  "BMW":            `${WV}/bmw.svg`,
  "Mercedes":       `${WV}/mercedes-benz.svg`,
  "Mercedes-Benz":  `${WV}/mercedes-benz.svg`,
  "Tesla":          `${WV}/tesla-motors.svg`,
  "Volkswagen":     `${WV}/volkswagen.svg`,
  "Volvo":          `${WV}/volvo.svg`,
  "Fiat":           `${WV}/fiat.svg`,
  "Peugeot":        `${WV}/peugeot.svg`,
  "Ford":           `${WV}/ford.svg`,
  "Renault":        `${WV}/renault.svg`,
  "Opel":           `${WV}/opel.svg`,
  "Toyota":         `${WV}/toyota.svg`,
  "Nissan":         `${WV}/nissan.svg`,
  "Hyundai":        `${WV}/hyundai.svg`,
  "Kia":            `${WV}/kia.svg`,
  "Citroën":        `${WV}/citroen.svg`,
  "Citroen":        `${WV}/citroen.svg`,
  "Alfa Romeo":     `${WV}/alfa-romeo.svg`,
  "Jeep":           `${WV}/jeep.svg`,
  "Land Rover":     `${WV}/land-rover.svg`,
  "Porsche":        `${WV}/porsche.svg`,
  "Skoda":          `${WV}/skoda.svg`,
  "SEAT":           `${WV}/seat.svg`,
  "Iveco":          `${WV}/iveco.svg`,
  "Honda":          `${WV}/honda.svg`,
  "Mazda":          `${WV}/mazda.svg`,
  "Dacia":          `${WV}/dacia.svg`,
  "Suzuki":         `${WV}/suzuki.svg`,
  "Mitsubishi":     `${WV}/mitsubishi.svg`,
  "Lexus":          `${WV}/lexus.svg`,
  "Jaguar":         `${WV}/jaguar.svg`,
  "Mini":           `${WV}/mini.svg`,
  "Subaru":         `${WV}/subaru.svg`,
  "Yamaha":         `${WV}/yamaha.svg`,
  "Kawasaki":       `${WV}/kawasaki.svg`,
  "Ducati":         `${WV}/ducati.svg`,
  "Piaggio":        `${WV}/piaggio.svg`,
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
