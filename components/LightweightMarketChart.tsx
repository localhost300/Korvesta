"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";

export function LightweightMarketChart({
  asset = "bitcoin",
  days = 7,
  height = 300,
}: {
  asset?: string;
  days?: number;
  height?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("Loading market candles…");

  useEffect(() => {
    if (!container.current) return;
    const chart = createChart(container.current, {
      height,
      width: container.current.clientWidth,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7f8c94",
        attributionLogo: false,
        fontFamily: "inherit",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(128,145,153,.07)" },
        horzLines: { color: "rgba(128,145,153,.10)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,196,0,.48)",
          labelBackgroundColor: "#bb8d00",
          style: 2,
        },
        horzLine: {
          color: "rgba(255,196,0,.32)",
          labelBackgroundColor: "#bb8d00",
          style: 2,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 2,
        barSpacing: 8,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#18c77b",
      downColor: "#f05260",
      borderVisible: false,
      wickUpColor: "#18c77b",
      wickDownColor: "#f05260",
      priceLineColor: "rgba(255,196,0,.55)",
      priceLineStyle: 2,
    });
    const movingAverage = chart.addSeries(LineSeries, {
      color: "#9bd51a",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const rsi = chart.addSeries(LineSeries, {
      color: "#ffc400",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: { type: "price", precision: 0, minMove: 1 },
    }, 1);
    const controller = new AbortController();
    fetch(`/api/market/ohlc?asset=${encodeURIComponent(asset)}&days=${days}`, {
      signal: controller.signal,
    })
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error);
        const candles = body.data.map(
            (candle: {
              time: number;
              open: number;
              high: number;
              low: number;
              close: number;
            }) => ({ ...candle, time: candle.time as UTCTimestamp }),
          );
        series.setData(candles);
        movingAverage.setData(candles.flatMap((candle: {time: UTCTimestamp; close: number}, index: number) => {
          if (index < 9) return [];
          const average = candles.slice(index - 9, index + 1).reduce((sum: number, item: {close: number}) => sum + item.close, 0) / 10;
          return [{ time: candle.time, value: average }];
        }));
        const closes = candles.map((candle: {close: number}) => candle.close);
        rsi.setData(candles.flatMap((candle: {time: UTCTimestamp}, index: number) => {
          if (index < 14) return [];
          let gains = 0; let losses = 0;
          for (let i = index - 13; i <= index; i++) { const change = closes[i] - closes[i - 1]; if (change >= 0) gains += change; else losses -= change; }
          const value = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
          return [{ time: candle.time, value }];
        }));
        chart.priceScale("right", 1).applyOptions({ scaleMargins: { top: 0.12, bottom: 0.12 } });
        const panes = chart.panes();
        if (panes[1]) panes[1].setHeight(105);
        chart.timeScale().fitContent();
        setMessage("");
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          setMessage("Live candles are temporarily unavailable.");
      });
    return () => {
      controller.abort();
      chart.remove();
    };
  }, [asset, days, height]);

  return (
    <div
      className="dash-chart-surface relative mt-3 min-w-0 overflow-hidden rounded-xl border border-[var(--dash-line-soft)]"
      style={{ minHeight: height }}
    >
      <div
        ref={container}
        className="w-full"
        aria-label={`${asset} interactive candlestick chart`}
      />
      {!message ? (
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2 text-[10px] font-semibold">
          <span className="rounded bg-[#11181ddd] px-2 py-1 text-[#9bd51a]">MA 10</span>
          <span className="rounded bg-[#11181ddd] px-2 py-1 text-[#ffc400]">RSI 14</span>
        </div>
      ) : null}
      {message ? (
        <p
          role="status"
          className="absolute inset-0 grid place-items-center bg-[var(--dash-card)]/50 text-xs text-muted backdrop-blur-sm"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
