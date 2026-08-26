"use client";
import { AssetCard } from "./MarketCards";
import type { Asset } from "@/lib/data";
import { useLiveFixedIncome } from "@/lib/use-live-fixed-income";
import { formatUsd,useLivePrices } from "@/lib/use-live-prices";
export function LiveAssetCard({asset}:{asset:Asset}){const fixed=useLiveFixedIncome();const crypto=useLivePrices().prices;const key=asset.symbol==="BTC"?"bitcoin":asset.symbol==="ETH"?"ethereum":"";const live=fixed[asset.symbol]??crypto[key];return <AssetCard asset={live?{...asset,price:formatUsd(live.price),change24h:live.change24h??asset.change24h}:asset}/>}
