"use client";

import { useId, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";

type InteractiveChartProps = {
  data: number[];
  colour?: string;
  symbol?: string;
  currency?: string;
  height?: number;
  timeframes?: string[];
  defaultTimeframe?: string;
  showControls?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
};

const DEFAULT_TIMEFRAMES = ["1H", "1D", "7D", "30D", "1Y"];

function formatValue(value: number, prefix: string, suffix: string) {
  const decimals = Math.abs(value) < 1 ? 4 : Math.abs(value) < 100 ? 2 : 0;
  return `${prefix}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function timeframeData(data: number[], timeframe: string) {
  const factors: Record<string, number> = {
    "1M": 0.12,
    "5M": 0.18,
    "15M": 0.24,
    "1H": 0.35,
    "4H": 0.5,
    "1D": 0.62,
    "7D": 0.78,
    "30D": 0.9,
    "1Y": 1,
    ALL: 1,
  };
  const factor = factors[timeframe] ?? 1;
  const count = Math.max(8, Math.round(data.length * factor));
  return data.slice(Math.max(0, data.length - count));
}

export function InteractiveChart({
  data,
  colour = "#ffc400",
  symbol = "Portfolio",
  currency = "USD",
  height = 300,
  timeframes = DEFAULT_TIMEFRAMES,
  defaultTimeframe,
  showControls = true,
  valuePrefix = "$",
  valueSuffix = "",
}: InteractiveChartProps) {
  const [timeframe, setTimeframe] = useState(defaultTimeframe ?? timeframes[0]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const gradientId = `chart-${useId().replaceAll(":", "")}`;
  const visibleData = useMemo(
    () => timeframeData(data, timeframe),
    [data, timeframe],
  );

  const geometry = useMemo(() => {
    const width = 1000;
    const plotHeight = 300;
    const min = Math.min(...visibleData);
    const max = Math.max(...visibleData);
    const range = max - min || 1;
    const points = visibleData.map((value, index) => ({
      value,
      x:
        visibleData.length === 1
          ? width / 2
          : (index / (visibleData.length - 1)) * width,
      y: 20 + (1 - (value - min) / range) * (plotHeight - 40),
    }));
    return { min, max, points, width, plotHeight };
  }, [visibleData]);

  const activeIndex = hoverIndex ?? visibleData.length - 1;
  const activePoint = geometry.points[activeIndex];
  const first = visibleData[0] ?? 0;
  const latest = visibleData.at(-1) ?? 0;
  const change = first === 0 ? 0 : ((latest - first) / first) * 100;
  const linePoints = geometry.points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const areaPoints = `0,${geometry.plotHeight} ${linePoints} ${geometry.width},${geometry.plotHeight}`;

  const updatePointer = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (visibleData.length - 1)));
  };

  return (
    <div
      className="interactive-chart"
      aria-label={`${symbol} interactive ${timeframe} chart`}
    >
      {showControls ? (
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <strong className="metric-value text-xl sm:text-2xl">
                {formatValue(latest, valuePrefix, valueSuffix)}
              </strong>
              <span
                className={clsx(
                  "text-xs font-semibold",
                  change >= 0 ? "text-[#00d084]" : "text-[#ef4444]",
                )}
              >
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[#77858e]">
              {symbol} · {currency}
            </p>
          </div>
          <div className="flex max-w-full overflow-x-auto rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-1 scrollbar-none">
            {timeframes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTimeframe(option);
                  setHoverIndex(null);
                }}
                className={clsx(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition",
                  timeframe === option
                    ? "bg-[#ffc400] text-black"
                    : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        ref={frameRef}
        className="dash-chart-grid dash-chart-surface relative w-full min-w-0 cursor-crosshair overflow-hidden rounded-xl border border-[var(--dash-line-soft)]"
        style={{ height }}
        onMouseMove={(event) => updatePointer(event.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(event) => updatePointer(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <div className="pointer-events-none absolute inset-y-3 right-2 z-10 flex flex-col items-end justify-between text-[9px] text-[var(--dash-muted)]">
          <span className="chart-axis-label">
            {formatValue(geometry.max, valuePrefix, valueSuffix)}
          </span>
          <span className="chart-axis-label">
            {formatValue(
              (geometry.max + geometry.min) / 2,
              valuePrefix,
              valueSuffix,
            )}
          </span>
          <span className="chart-axis-label">
            {formatValue(geometry.min, valuePrefix, valueSuffix)}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.plotHeight}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colour} stopOpacity=".28" />
              <stop offset="55%" stopColor={colour} stopOpacity=".08" />
              <stop offset="100%" stopColor={colour} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
          <polyline
            points={linePoints}
            fill="none"
            stroke={colour}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="chart-glow-line"
          />
          {activePoint ? (
            <>
              <line
                x1={activePoint.x}
                y1="0"
                x2={activePoint.x}
                y2={geometry.plotHeight}
                stroke="rgba(148,163,184,.55)"
                strokeDasharray="5 5"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill={colour}
                stroke="white"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </svg>
        {activePoint ? (
          <div
            className="pointer-events-none absolute top-3 z-20 min-w-[116px] rounded-xl border border-[var(--dash-line)] bg-[color:var(--dash-card)]/95 px-3 py-2 shadow-2xl backdrop-blur-md"
            style={{
              left: `${Math.min(76, Math.max(22, (activePoint.x / geometry.width) * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-[9px] uppercase tracking-[.12em] text-[var(--dash-muted)]">
              Point {activeIndex + 1}
            </p>
            <p className="mt-1 text-xs font-semibold">
              {formatValue(activePoint.value, valuePrefix, valueSuffix)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-[#64727a]">
        <span>Start</span>
        <span>Midpoint</span>
        <span>Latest</span>
      </div>
    </div>
  );
}
