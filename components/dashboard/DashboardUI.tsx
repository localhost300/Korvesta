"use client";

import type { Icon } from "@tabler/icons-react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { clsx } from "clsx";
import { Sparkline } from "@/components/Charts";

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={clsx("dash-card", className)}>
      {(title || action) && (
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 text-[15px] font-semibold leading-5">
            {title}
          </h2>
          <div className="max-w-full shrink-0">{action}</div>
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#849099]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  colour = "#ffc400",
  data = [10, 18, 14, 26, 22, 34, 30, 43],
}: {
  label: string;
  value: string;
  change?: string;
  icon?: Icon;
  colour?: string;
  data?: number[];
}) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <Card className="min-h-[126px] overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs leading-4 text-[#8b969e]">{label}</p>
          <p className="metric-value mt-3 break-words text-[clamp(1.15rem,2vw,1.45rem)] font-semibold leading-tight">
            {value}
          </p>
          {change && (
            <p className="mt-1 break-words text-xs font-medium text-[#00d084]">
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <span
            className="grid size-10 place-items-center rounded-full"
            style={{
              color: colour,
              background: `${colour}16`,
              border: `1px solid ${colour}35`,
            }}
          >
            <Icon size={20} />
          </span>
        )}
      </div>
      <div className="mt-2 h-8 opacity-80">
        <LineChart data={chartData} colour={colour} compact />
      </div>
    </Card>
  );
}

export function LineChart({
  data,
  colour = "#ffc400",
  compact = false,
  yAxis = false,
}: {
  data: Array<number | { index: number; value: number }>;
  colour?: string;
  compact?: boolean;
  yAxis?: boolean;
}) {
  const values = data.map((entry) =>
    typeof entry === "number" ? entry : entry.value,
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const moneyTick = (value: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  return (
    <div
      className={clsx(
        "relative h-full min-w-0 overflow-hidden rounded-xl",
        !compact && "dash-chart-grid dash-chart-surface",
      )}
    >
      {yAxis && (
        <div className="pointer-events-none absolute inset-y-3 right-2 z-10 flex flex-col items-end justify-between text-[9px] text-[var(--dash-muted)]">
          <span className="chart-axis-label">{moneyTick(max)}</span>
          <span className="chart-axis-label">{moneyTick((max + min) / 2)}</span>
          <span className="chart-axis-label">{moneyTick(min)}</span>
        </div>
      )}
      <div className={clsx("h-full min-w-0", yAxis && "pr-12")}>
        <Sparkline
          data={values}
          positive={colour !== "#ef4444"}
          colour={colour}
          height={compact ? 42 : 280}
          showGrid={compact}
        />
      </div>
    </div>
  );
}

export function AllocationChart({ value = "$248,420.50" }: { value?: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[190px]">
      <div
        className="absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "conic-gradient(#ffc400 0 42.13%, #2f80ed 42.13% 67.37%, #20c7c7 67.37% 85.72%, #7847e7 85.72% 100%)",
        }}
      >
        <div className="absolute inset-[17%] rounded-full bg-[var(--dash-card)] shadow-[inset_0_0_24px_rgba(0,0,0,.2)]" />
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        <strong className="max-w-[72%] break-words text-[clamp(.72rem,2vw,.95rem)] leading-tight">
          {value}
        </strong>
        <span className="text-[10px] text-[#7f8a92]">Total</span>
      </div>
    </div>
  );
}

export function Coin({
  symbol,
  colour = "#ffc400",
  size = "md",
}: {
  symbol: string;
  colour?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={clsx(
        "coin",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-base",
      )}
      style={{ background: colour }}
    >
      {symbol.slice(0, 1)}
    </span>
  );
}

export function Status({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "purple";
}) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

export function ActionLink({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#ffc400] hover:text-[#ffdc55]">
      {children}
      <IconArrowUpRight size={14} />
    </button>
  );
}

export function DataTable({
  headers,
  rows,
  compact = false,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className={clsx("dash-table", compact && "dash-table-compact")}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-[#202930] bg-[#090e11] p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={clsx(
            "rounded-md px-3 py-1.5 text-[11px] font-medium transition",
            value === option
              ? "bg-[#5b2bad] text-white shadow-[0_0_22px_rgba(124,58,237,.35)]"
              : "text-[#89949c] hover:text-white",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
