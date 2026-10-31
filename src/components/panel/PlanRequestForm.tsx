import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonSecondary } from "@/components/ui";

export function PlanRequestForm({
  planSlug,
  planName,
  current,
}: {
  planSlug: string;
  planName: string;
  current: boolean;
}) {
  if (current) {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-800 ring-1 ring-inset ring-green-200">
        Plano atual
      </span>
    );
  }

  return (
    <Link
      href={`/checkout?plano=${encodeURIComponent(planSlug)}&troca=1`}
      className={`${buttonSecondary} w-full`}
    >
      Escolher {planName}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
