-- One-time fix: divide monthly_rent by 1.22 for all Privati rows
-- Reason: CMS previously baked IVA into the stored value during P.IVA→Privati duplication,
-- but the frontend applies 1.22 at display time — causing double VAT.
-- All Privati rows were created via duplication, so all need this correction.

BEGIN;

UPDATE offer_configs
SET monthly_rent = ROUND(monthly_rent / 1.22)
WHERE segment = 'Privati';

COMMIT;
