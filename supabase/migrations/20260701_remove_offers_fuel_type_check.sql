-- Rimuove i check constraint brittle su offers.category, offers.fuel_type e offers.transmission
-- per consentire opzioni dinamiche inserite dal CMS (vehicle_options).
alter table offers drop constraint if exists offers_category_check;
alter table offers drop constraint if exists offers_fuel_type_check;
alter table offers drop constraint if exists offers_transmission_check;
