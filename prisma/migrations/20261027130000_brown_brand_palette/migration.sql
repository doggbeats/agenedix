-- Update the default brand color to the black, white and light brown palette.
ALTER TABLE "Establishment"
  ALTER COLUMN "brandColor" SET DEFAULT '#9A6B4F';

-- Apply the palette to the public Barbearia Nobre experience only.
UPDATE "Establishment"
SET "brandColor" = '#9A6B4F'
WHERE "slug" = 'barbearia-nobre';
