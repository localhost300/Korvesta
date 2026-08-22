import type { CustodyProvider, ExecutionProvider } from "./types";
const unavailable = async (): Promise<never> => { throw new Error("Live financial execution is disabled pending provider onboarding and regulatory approval."); };
export const binanceExecution: ExecutionProvider = { live: false, placeOrder: unavailable };
export const fireblocksCustody: CustodyProvider = { live: false, createWithdrawal: unavailable };
