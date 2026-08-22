export type OhlcCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};
export interface MarketDataProvider {
  prices(
    ids: string[],
    currency?: string,
  ): Promise<
    Record<
      string,
      {
        price: number;
        change24h: number | null;
        updatedAt: number;
        marketCap: number | null;
        volume24h: number | null;
      }
    >
  >;
  ohlc(id: string, days?: number): Promise<OhlcCandle[]>;
}
export interface ExecutionProvider {
  readonly live: boolean;
  placeOrder(): Promise<never>;
}
export interface CustodyProvider {
  readonly live: boolean;
  createWithdrawal(): Promise<never>;
}
