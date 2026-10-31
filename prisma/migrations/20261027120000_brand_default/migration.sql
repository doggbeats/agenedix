-- Alinha o valor padrão da marca à identidade visual do Agendix.
ALTER TABLE "Establishment"
  ALTER COLUMN "brandColor" SET DEFAULT '#2563EB';

-- Corrige registros criados com o valor do protótipo anterior.
UPDATE "Establishment"
  SET "brandColor" = '#2563EB'
  WHERE "brandColor" = '#B6FF00';
