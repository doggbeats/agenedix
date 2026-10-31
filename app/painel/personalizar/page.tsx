import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth/session";
import { brandingFormDefaults } from "@/lib/branding";
import { buttonSecondary, PageHeader } from "@/components/ui";
import { BrandingForm } from "@/components/panel/BrandingForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Personalizar página" };

export default async function BrandingPage() {
  const auth = await requireManager();
  const establishment = auth.establishment;
  const branding = await prisma.tenantBranding.findUnique({
    where: { establishmentId: establishment.id },
  });
  const view = brandingFormDefaults(branding, establishment.brandColor);

  return (
    <div>
      <PageHeader
        eyebrow="Personalizar página"
        title="A sua marca, do seu jeito"
        description="Cores, tipografia, capa e seções da página pública de agendamento. A prévia ao lado atualiza enquanto você edita."
        actions={
          <Link
            href={`/agendar/${establishment.slug}`}
            target="_blank"
            className={buttonSecondary}
          >
            <ExternalLink className="h-4 w-4" /> Abrir página pública
          </Link>
        }
      />
      <BrandingForm
        establishmentName={establishment.name}
        segment={establishment.segment}
        slug={establishment.slug}
        branding={view}
        fallbackColor={establishment.brandColor}
      />
    </div>
  );
}
