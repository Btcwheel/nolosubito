-- Aggiunge "GPL" al check constraint di offers.fuel_type
-- (opzione GPL aggiunta in vehicle_options il 2026-05-29 ma mai allineata al vincolo DB)
alter table offers drop constraint if exists offers_fuel_type_check;
alter table offers add constraint offers_fuel_type_check
  check (fuel_type in ('Diesel','Petrol','Electric','Hybrid','GPL'));
