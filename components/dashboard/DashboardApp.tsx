"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "./DashboardShell";
import { OverviewPage, WalletPage } from "./CorePages";
import { RealMarketsPage } from "./RealMarketsPage";
import { DepositFlow, WithdrawFlow } from "./ManualPaymentFlows";
import { TransactionsPage } from "./AccountPages";
import { RealKycPage } from "./RealKycPage";
import { AccountSecurityPage } from "./AccountSecurityPage";
import { RealSettingsPage } from "./RealSettingsPage";
import { FixedInvestmentPage } from "./FixedInvestmentPage";
import { PersistentTradingPage } from "./PersistentTradingPage";
import { UnavailableFinancialFeature } from "./UnavailableFinancialFeature";

function CurrentPage() {
  const pathname = usePathname();
  if (pathname === "/dashboard") return <OverviewPage />;
  if (pathname === "/dashboard/portfolio") return <FixedInvestmentPage />;
  if (pathname === "/dashboard/markets") return <RealMarketsPage />;
  if (pathname === "/dashboard/trade/futures")
    return <PersistentTradingPage product="futures" />;
  if (pathname === "/dashboard/trade/demo")
    return <PersistentTradingPage product="demo" />;
  if (pathname === "/dashboard/trade")
    return <PersistentTradingPage product="spot" />;
  if (pathname.startsWith("/dashboard/ai-trading"))
    return (
      <UnavailableFinancialFeature
        title="AI Trading Bots"
        description="Automated execution requires a tested strategy engine, risk controls, exchange permissions, reconciliation, and monitoring. Those services are not configured."
      />
    );
  if (pathname.startsWith("/dashboard/copy-trading"))
    return (
      <UnavailableFinancialFeature
        title="Copy Trading"
        description="Copy trading requires verified strategy providers, allocation controls, execution reconciliation, and customer suitability checks. Those services are not configured."
      />
    );
  if (pathname === "/dashboard/earn") return <FixedInvestmentPage />;
  if (pathname === "/dashboard/wallet/deposit") return <DepositFlow />;
  if (pathname === "/dashboard/wallet/withdraw") return <WithdrawFlow />;
  if (pathname === "/dashboard/wallet/connect")
    return (
      <UnavailableFinancialFeature
        title="Connected Wallets"
        description="No audited wallet-signature or custody integration is configured. Korvesta will not display fabricated wallet addresses or balances."
      />
    );
  if (pathname === "/dashboard/wallet") return <WalletPage />;
  if (pathname === "/dashboard/transactions") return <TransactionsPage />;
  if (pathname === "/dashboard/security") return <AccountSecurityPage />;
  if (pathname === "/dashboard/kyc") return <RealKycPage />;
  if (pathname === "/dashboard/referrals")
    return (
      <UnavailableFinancialFeature
        title="Referrals"
        description="No commission ledger, referral attribution service, or payout workflow is configured."
      />
    );
  if (pathname === "/dashboard/settings") return <RealSettingsPage />;
  return <OverviewPage />;
}

export function DashboardApp() {
  return (
    <DashboardShell>
      <CurrentPage />
    </DashboardShell>
  );
}
