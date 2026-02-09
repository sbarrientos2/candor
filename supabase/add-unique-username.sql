-- Migration: Add unique constraint on display_name
-- Run this in Supabase SQL Editor

-- First, fix any duplicate display_names by appending wallet prefix
-- (e.g. multiple "Anon" users become "Anon_HwbE", "Anon_9xK3", etc.)
WITH duplicates AS (
  SELECT id, display_name, wallet_address,
    ROW_NUMBER() OVER (PARTITION BY display_name ORDER BY created_at) as rn
  FROM users
)
UPDATE users
SET display_name = users.display_name || '_' || LEFT(users.wallet_address, 4)
FROM duplicates
WHERE users.id = duplicates.id
  AND duplicates.rn > 1;

-- Now add the unique constraint
ALTER TABLE users ADD CONSTRAINT unique_display_name UNIQUE (display_name);
