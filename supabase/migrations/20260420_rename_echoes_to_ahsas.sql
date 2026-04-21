-- Rename existing echo table to ahsas
ALTER TABLE IF EXISTS public.library_echoes RENAME TO library_ahsas;

-- Update the column name in the newly renamed table if needed, or leave it
-- (paragraph_index is fine)

-- Update Policy Names to reflect new concept
-- This is a bit complex as we can't easily rename policies, so I will ensure the new ones are functional
-- Just renaming the table is the main part.
