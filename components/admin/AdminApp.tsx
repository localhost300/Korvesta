"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { RealKycAdminPage } from "./RealKycAdminPage";
import { SecurityMonitoringPage } from "./SecurityMonitoringPage";
import { RealCustomersPage } from "./RealCustomersPage";
import {
  AdminSettingsPage,
  CommunicationsPage,
  SupportAdminPage,
  TeamRolesPage,
} from "./AdminOperationsPages";
import { PaymentMethodsPage } from "./PaymentMethodsPage";
import { LivePaymentsPage } from "./LivePaymentsPage";
import {
  RealAdminInvestmentsPage,
  RealAdminOverviewPage,
  RealAdminTradingPage,
  RealAdminTransactionsPage,
  RealAdminUnavailablePage,
} from "./RealAdminFinancialPages";

function CurrentAdminPage() {
  const pathname = usePathname();
  if (pathname === "/admin") return <RealAdminOverviewPage />;
  if (pathname.startsWith("/admin/customers")) return <RealCustomersPage />;
  if (pathname.startsWith("/admin/kyc")) return <RealKycAdminPage />;
  if (pathname === "/admin/payments/methods") return <PaymentMethodsPage />;
  if (pathname.startsWith("/admin/payments")) return <LivePaymentsPage />;
  if (pathname.startsWith("/admin/transactions"))
    return <RealAdminTransactionsPage />;
  if (pathname.startsWith("/admin/investments"))
    return <RealAdminInvestmentsPage />;
  if (pathname.startsWith("/admin/trading")) return <RealAdminTradingPage />;
  if (pathname.startsWith("/admin/bots"))
    return (
      <RealAdminUnavailablePage
        title="Bot Management"
        description="No strategy-engine or bot-execution service is configured."
      />
    );
  if (pathname.startsWith("/admin/staking"))
    return (
      <RealAdminUnavailablePage
        title="Staking Management"
        description="Fixed-APY investments are available under Investments; no separate staking provider is configured."
      />
    );
  if (pathname.startsWith("/admin/support")) return <SupportAdminPage />;
  if (pathname.startsWith("/admin/communications"))
    return <CommunicationsPage />;
  if (pathname.startsWith("/admin/reports"))
    return (
      <RealAdminUnavailablePage
        title="Financial Reports"
        description="A verified reporting pipeline and export schema have not been configured."
      />
    );
  if (pathname.startsWith("/admin/audit")) return <SecurityMonitoringPage />;
  if (pathname.startsWith("/admin/team")) return <TeamRolesPage />;
  if (pathname.startsWith("/admin/settings")) return <AdminSettingsPage />;
  return <RealAdminOverviewPage />;
}

export function AdminApp() {
  return (
    <AdminShell>
      <CurrentAdminPage />
    </AdminShell>
  );
}
