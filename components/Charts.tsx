import { useId } from "react";
import { marketLine } from "@/lib/data";

function pointsFor(
  data: number[],
  width: number,
  height: number,
  padX: number,
  padY: number,
) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map(
      (value, index) =>
        `${padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2)},${padY + (1 - (value - min) / range) * (height - padY * 2)}`,
    )
    .join(" ");
}

export function Sparkline({
  data,
  positive = true,
  height = 42,
  colour,
  showGrid = true,
}: {
  data: number[];
  positive?: boolean;
  height?: number;
  colour?: string;
  showGrid?: boolean;
}) {
  const id = `spark-${useId().replaceAll(":", "")}`;
  const stroke = colour ?? (positive ? "#28c76f" : "#ff4d43");
  const points = pointsFor(data, 240, 80, 5, 8);
  const first = points.split(" ").at(0)?.split(",") ?? [5, 40];
  const last = points.split(" ").at(-1)?.split(",") ?? [235, 40];
  return (
    <div style={{ height }} className="w-full overflow-hidden">
      <svg
        viewBox="0 0 240 80"
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Seven-day price trend"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity=".12" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGrid && (
          <g
            aria-hidden="true"
            stroke="var(--dash-line-soft, #2d383f)"
            strokeWidth="1"
            opacity=".42"
            vectorEffect="non-scaling-stroke"
          >
            {[8, 29.33, 50.67, 72].map((y) => (
              <line key={`h-${y}`} x1="5" y1={y} x2="235" y2={y} />
            ))}
            {[5, 62.5, 120, 177.5, 235].map((x) => (
              <line key={`v-${x}`} x1={x} y1="8" x2={x} y2="72" />
            ))}
          </g>
        )}
        <polygon points={`5,80 ${points} 235,80`} fill={`url(#${id})`} />
        <line
          aria-hidden="true"
          x1="5"
          y1={last[1]}
          x2="235"
          y2={last[1]}
          stroke={stroke}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity=".28"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={first[0]}
          cy={first[1]}
          r="1.75"
          fill={stroke}
          opacity=".55"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={last[0]}
          cy={last[1]}
          r="2.5"
          fill={stroke}
          stroke="var(--dash-card,#0b1114)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function MarketHeroChart({ compact = false }: { compact?: boolean }) {
  const line = pointsFor(marketLine, 680, 290, 48, 18);
  const area = `48,266 ${line} 632,266`;
  return (
    <div className={compact ? "h-[190px]" : "h-[290px]"}>
      <svg
        viewBox="0 0 680 290"
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Bitcoin intraday price chart"
      >
        <defs>
          <linearGradient
            id={compact ? "goldAreaCompact" : "goldArea"}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#ffc400" stopOpacity=".34" />
            <stop offset="100%" stopColor="#ffc400" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[18, 80, 142, 204, 266].map((y) => (
          <line
            key={y}
            x1="48"
            y1={y}
            x2="632"
            y2={y}
            stroke="rgba(128,145,153,.15)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polygon
          points={area}
          fill={`url(#${compact ? "goldAreaCompact" : "goldArea"})`}
        />
        <polyline
          points={line}
          fill="none"
          stroke="#ffc400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {[
          [12, "77,000"],
          [77, "73,500"],
          [139, "70,000"],
          [201, "66,500"],
          [263, "63,000"],
        ].map(([y, label]) => (
          <text
            key={String(label)}
            x="0"
            y={Number(y) + 4}
            fill="#738088"
            fontSize="10"
          >
            {label}
          </text>
        ))}
        {["00:00", "06:00", "12:00", "18:00", "24:00"].map((label, i) => (
          <text
            key={label}
            x={48 + i * 146}
            y="286"
            fill="#738088"
            fontSize="10"
            textAnchor={i === 4 ? "end" : "middle"}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function Candles() {
  const bars = [37, 48, 31, 57, 44, 64, 52, 72, 58, 46, 67, 75, 55, 81, 70, 88];
  return (
    <div className="flex h-24 items-end gap-2 px-3">
      {bars.map((h, i) => (
        <span
          key={i}
          className="relative w-full rounded-sm"
          style={{
            height: `${h}%`,
            background: i % 3 === 0 ? "#ff4d43" : "#28c76f",
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

export type CandlePoint = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

const bitcoinCandles: CandlePoint[] = marketLine
  .slice(0, -1)
  .map((open, index) => {
    const close = marketLine[index + 1];
    const spread = 180 + (index % 5) * 55;
    return {
      time: `${String(Math.floor((index * 24) / (marketLine.length - 1))).padStart(2, "0")}:00`,
      open,
      close,
      high: Math.max(open, close) + spread,
      low: Math.min(open, close) - Math.round(spread * 0.8),
    };
  });

export function LightweightCandlestickChart({
  data = bitcoinCandles,
  height = 260,
}: {
  data?: CandlePoint[];
  height?: number;
}) {
  const width = 720,
    left = 56,
    right = 706,
    top = 12,
    bottom = 228;
  const minimum = Math.min(...data.map((candle) => candle.low));
  const maximum = Math.max(...data.map((candle) => candle.high));
  const range = maximum - minimum || 1;
  const y = (value: number) =>
    top + (1 - (value - minimum) / range) * (bottom - top);
  const step = (right - left) / Math.max(data.length, 1);
  const bodyWidth = Math.max(3, Math.min(11, step * 0.58));
  const priceTicks = Array.from(
    { length: 5 },
    (_, index) => maximum - (index * range) / 4,
  );
  const timeTicks = [
    0,
    Math.floor((data.length - 1) / 2),
    data.length - 1,
  ].filter((value, index, list) => list.indexOf(value) === index);
  return (
    <figure
      style={{ height }}
      className="w-full"
      aria-label="BTC to USDT candlestick price chart"
    >
      <svg
        viewBox={`0 0 ${width} 250`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-labelledby="candlestick-title candlestick-description"
      >
        <title id="candlestick-title">
          BTC/USDT intraday candlestick chart
        </title>
        <desc id="candlestick-description">
          Green candles closed above their opening price and red candles closed
          below it.
        </desc>
        {priceTicks.map((price) => {
          const tickY = y(price);
          return (
            <g key={price}>
              <line
                x1={left}
                y1={tickY}
                x2={right}
                y2={tickY}
                stroke="rgba(128,145,153,.16)"
                vectorEffect="non-scaling-stroke"
              />
              <text x="0" y={tickY + 4} fill="#738088" fontSize="10">
                {Math.round(price).toLocaleString()}
              </text>
            </g>
          );
        })}
        {data.map((candle, index) => {
          const x = left + step * index + step / 2;
          const colour = candle.close >= candle.open ? "#28c76f" : "#ff4d43";
          const bodyTop = y(Math.max(candle.open, candle.close));
          const bodyHeight = Math.max(
            1.5,
            Math.abs(y(candle.open) - y(candle.close)),
          );
          return (
            <g key={`${candle.time}-${index}`}>
              <line
                x1={x}
                y1={y(candle.high)}
                x2={x}
                y2={y(candle.low)}
                stroke={colour}
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={x - bodyWidth / 2}
                y={bodyTop}
                width={bodyWidth}
                height={bodyHeight}
                rx="1"
                fill={colour}
              />
            </g>
          );
        })}
        {timeTicks.map((index) => (
          <text
            key={index}
            x={left + step * index + step / 2}
            y="246"
            textAnchor={
              index === 0
                ? "start"
                : index === data.length - 1
                  ? "end"
                  : "middle"
            }
            fill="#738088"
            fontSize="10"
          >
            {data[index]?.time}
          </text>
        ))}
      </svg>
      <figcaption className="sr-only">
        Open, high, low and close data for {data.length} intraday periods.
      </figcaption>
    </figure>
  );
}
