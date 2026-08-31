"use client";
import { useMemo, useState } from "react";
import { IconBell, IconSearch, IconStar } from "@tabler/icons-react";
import { assets } from "@/lib/data";
import { MarketStatCard, MarketsTable, MoversList } from "./MarketCards";
export function MarketsDashboard({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All markets");
  const visible = useMemo(
    () =>
      assets.filter((a) => {
        const matchesQuery = `${a.name} ${a.symbol}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const assetCategory = a.category ?? "Bonds";
        return (
          matchesQuery &&
          (category === "All markets" || assetCategory === category)
        );
      }),
    [category, query],
  );
  return (
    <div className="container-shell py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-.04em]">
            Global Markets
          </h1>
          <p className="mt-2 text-sm text-muted">
            Live US stocks, broad-market ETFs, bonds and digital assets
          </p>
        </div>
        <label className="relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field pl-9"
            placeholder="Search bonds and ETFs..."
          />
        </label>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MarketStatCard
          label="US stocks"
          value="11 tracked"
          change={1}
          data={assets[12].data}
        />
        <MarketStatCard
          label="Stock-market ETFs"
          value="3 tracked"
          change={1}
          data={assets[8].data}
        />
        <MarketStatCard
          label="Fixed income"
          value="8 tracked"
          change={0}
          data={assets[2].data}
        />
        <MarketStatCard
          label="Digital assets"
          value="2 tracked"
          change={1}
          data={assets[22].data}
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex gap-2">
            {["All markets", "US Stocks", "Stock ETFs", "Bonds", "Crypto"].map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCategory(t)}
                  className={`ghost-button min-h-9 text-xs ${category === t ? "border-[var(--amber)] text-[var(--amber)]" : ""}`}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {visible.length ? (
            <MarketsTable limit={visible.length} items={visible} />
          ) : (
            <div className="surface p-12 text-center text-sm text-muted">
              No securities match your search.
            </div>
          )}
        </section>
        <aside className="surface p-5">
          <h2 className="font-semibold">Popular US markets</h2>
          <p className="mt-1 text-xs text-muted">
            Live quotes refresh every 30 seconds
          </p>
          <div className="mt-5">
            <MoversList />
          </div>
          <a
            href="mailto:management@korvesta.org?subject=Korvesta%20bond%20market%20alert"
            className="gold-button mt-6 w-full"
          >
            <IconBell size={16} /> Request an alert
          </a>
          <a href="/learn" className="ghost-button mt-2 w-full">
            <IconStar size={16} /> Learn the risks
          </a>
        </aside>
      </div>
    </div>
  );
}
