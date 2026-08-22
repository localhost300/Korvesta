"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
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
    const controller = new AbortController();
    fetch(`/api/market/ohlc?asset=${encodeURIComponent(asset)}&days=${days}`, {
      signal: controller.signal,
    })
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error);
        series.setData(
          body.data.map(
            (candle: {
              time: number;
              open: number;
              high: number;
              low: number;
              close: number;
            }) => ({ ...candle, time: candle.time as UTCTimestamp }),
          ),
        );
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
