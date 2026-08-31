import { clsx } from "clsx";

const COINCAP_ICON_ROOT = "https://assets.coincap.io/assets/icons";

export function CryptoLogo({
  symbol,
  size = "md",
  className,
}: {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const normalized = symbol.trim().toLowerCase();
  return (
    <span
      className={clsx(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#202a30] font-bold text-white shadow-sm ring-1 ring-white/10",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-base",
        className,
      )}
      title={symbol.toUpperCase()}
    >
      <span aria-hidden="true">{symbol.slice(0, 1).toUpperCase()}</span>
      {normalized ? (
        // eslint-disable-next-line @next/next/no-img-element -- the symbol is dynamic and configured by an administrator
        <img
          src={`${COINCAP_ICON_ROOT}/${encodeURIComponent(normalized)}@2x.png`}
          alt={`${symbol.toUpperCase()} logo`}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      ) : null}
    </span>
  );
}
