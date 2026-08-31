"use client";

import { useState } from "react";
import { clsx } from "clsx";

const domains: Record<string, string> = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  NVDA: "nvidia.com",
  TSLA: "tesla.com",
  AMZN: "amazon.com",
  GOOGL: "google.com",
  META: "meta.com",
  JPM: "jpmorganchase.com",
  "BRK.B": "berkshirehathaway.com",
  JNJ: "jnj.com",
  XOM: "exxonmobil.com",
  KO: "coca-cola.com",
  SPY: "ssga.com",
  QQQ: "invesco.com",
  VTI: "vanguard.com",
  VEA: "vanguard.com",
  VWO: "vanguard.com",
  BND: "vanguard.com",
  AGG: "ishares.com",
  TLT: "ishares.com",
  SHY: "ishares.com",
  LQD: "ishares.com",
  TIP: "ishares.com",
  IEF: "ishares.com",
  VGSH: "vanguard.com",
  GLD: "ssga.com",
  VNQ: "vanguard.com",
  O: "realtyincome.com",
  PLD: "prologis.com",
};

export function MarketLogo({
  symbol,
  colour = "#334155",
  size = "md",
}: {
  symbol: string;
  colour?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const domain = domains[symbol.toUpperCase()];
  return (
    <span
      className={clsx(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ring-1 ring-white/10",
        size === "sm" && "size-7 text-[9px]",
        size === "md" && "size-9 text-[10px]",
        size === "lg" && "size-12 text-xs",
      )}
      style={{ background: colour }}
      title={`${symbol} logo`}
    >
      <span aria-hidden="true">{symbol.slice(0, 2).toUpperCase()}</span>
      {domain && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- logos are resolved dynamically from a symbol/domain map
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
          alt={`${symbol} logo`}
          className="absolute inset-0 size-full bg-white object-contain p-1"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}
