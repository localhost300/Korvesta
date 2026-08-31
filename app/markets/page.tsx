import { MarketsDashboard } from "@/components/MarketsDashboard";
import { PageShell } from "@/components/PageShell";

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return (
    <PageShell>
      <MarketsDashboard initialQuery={q} />
    </PageShell>
  );
}
