-- Convert servizi from text[] to jsonb to support [canonical, original] pairs
-- This fixes the data corruption issue where nested arrays were being serialized incorrectly

-- Step 1: Add new column
ALTER TABLE preventivi
  ADD COLUMN IF NOT EXISTS servizi_new jsonb DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing text[] data to jsonb format
-- Old format: ['RCA', 'Incendio e Furto', ...]
-- New format: [['RCA', null], ['Incendio e Furto', null], ...]
UPDATE preventivi
SET servizi_new = (
  SELECT jsonb_agg(
    CASE
      WHEN elem IS NULL THEN '["", null]'::jsonb
      ELSE jsonb_build_array(elem, null)
    END
  )
  FROM unnest(servizi) AS elem
)
WHERE servizi IS NOT NULL AND array_length(servizi, 1) > 0;

-- Step 3: Drop old column and rename new one
ALTER TABLE preventivi DROP COLUMN IF EXISTS servizi;
ALTER TABLE preventivi RENAME COLUMN servizi_new TO servizi;
