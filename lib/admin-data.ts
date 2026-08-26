export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  country: string;
  joined: string;
  tier: "Standard" | "Pro" | "VIP";
  kyc: "Verified" | "Pending" | "Rejected";
  status: "Active" | "Restricted" | "Suspended";
  portfolio: number;
  investment: number;
  trading: number;
  staking: number;
};

export type AdminInvestmentPlan = {
  id: string;
  name: string;
  apy: number;
  duration: string;
  minimum: number;
  maximum: number;
  investors: number;
  capital: number;
  risk: "Low" | "Moderate" | "High";
  status: "Active" | "Paused" | "Draft";
};

export type AdminPayment = {
  id: string;
  customer: string;
  type: "Deposit" | "Withdrawal";
  method: string;
  amount: number;
  submitted: string;
  status: "Pending" | "Approved" | "Rejected";
  proof?: string;
};

export type KycApplication = {
  id: string;
  customer: string;
  email: string;
  country: string;
  level: string;
  document: string;
  submitted: string;
  risk: "Low" | "Medium" | "High";
  status: "Pending" | "Approved" | "Rejected" | "Resubmission";
};

export const adminOverviewSeries = [118, 124, 121, 132, 139, 145, 142, 153, 161, 169, 176, 173, 188, 194, 202, 210, 219, 227, 238, 248];
export const revenueSeries = [42, 46, 44, 51, 49, 58, 61, 59, 67, 72, 70, 78, 82, 87, 91, 98, 104, 111, 119, 128];

export const initialCustomers: AdminCustomer[] = [
  { id: "KRV-10482", name: "Alex Johnson", email: "alex@korvesta.org", country: "Nigeria", joined: "12 Jun 2024", tier: "Pro", kyc: "Verified", status: "Active", portfolio: 248420.5, investment: 168240.7, trading: 78920.3, staking: 11259.5 },
  { id: "KRV-10481", name: "Amara Okafor", email: "amara.okafor@email.com", country: "Nigeria", joined: "11 Jun 2024", tier: "VIP", kyc: "Verified", status: "Active", portfolio: 412850.25, investment: 295600, trading: 98240.25, staking: 19010 },
  { id: "KRV-10480", name: "Daniel Mensah", email: "daniel.mensah@email.com", country: "Ghana", joined: "11 Jun 2024", tier: "Standard", kyc: "Pending", status: "Restricted", portfolio: 18420.8, investment: 12000, trading: 6420.8, staking: 0 },
  { id: "KRV-10479", name: "Thandi Mokoena", email: "thandi.m@email.com", country: "South Africa", joined: "10 Jun 2024", tier: "Pro", kyc: "Verified", status: "Active", portfolio: 126940.4, investment: 88200, trading: 30120.4, staking: 8620 },
  { id: "KRV-10478", name: "Chinedu Eze", email: "chinedu.eze@email.com", country: "Nigeria", joined: "10 Jun 2024", tier: "Standard", kyc: "Rejected", status: "Restricted", portfolio: 2850, investment: 0, trading: 2850, staking: 0 },
  { id: "KRV-10477", name: "Grace Wanjiku", email: "grace.w@email.com", country: "Kenya", joined: "9 Jun 2024", tier: "Pro", kyc: "Verified", status: "Active", portfolio: 75320.8, investment: 54100, trading: 17320.8, staking: 3900 },
  { id: "KRV-10476", name: "Ibrahim Bello", email: "ibrahim.b@email.com", country: "Nigeria", joined: "8 Jun 2024", tier: "VIP", kyc: "Verified", status: "Suspended", portfolio: 205480.55, investment: 145000, trading: 48700.55, staking: 11780 },
];

export const initialInvestmentPlans: AdminInvestmentPlan[] = [
  { id: "PLAN-001", name: "Stable Income", apy: 8.5, duration: "90 days", minimum: 500, maximum: 25000, investors: 842, capital: 2845000, risk: "Low", status: "Active" },
  { id: "PLAN-002", name: "Balanced Growth", apy: 14.2, duration: "180 days", minimum: 1000, maximum: 100000, investors: 516, capital: 5290000, risk: "Moderate", status: "Active" },
  { id: "PLAN-003", name: "Digital Asset Growth", apy: 21.5, duration: "365 days", minimum: 2500, maximum: 250000, investors: 271, capital: 4760000, risk: "High", status: "Active" },
  { id: "PLAN-004", name: "Treasury Reserve", apy: 6.25, duration: "Flexible", minimum: 100, maximum: 50000, investors: 1204, capital: 1985000, risk: "Low", status: "Paused" },
];

export const initialKycApplications: KycApplication[] = [
  { id: "KYC-9051", customer: "Daniel Mensah", email: "daniel.mensah@email.com", country: "Ghana", level: "Level 2", document: "National ID", submitted: "12 minutes ago", risk: "Low", status: "Pending" },
  { id: "KYC-9050", customer: "Amina Yusuf", email: "amina.y@email.com", country: "Nigeria", level: "Level 3", document: "Passport", submitted: "28 minutes ago", risk: "Medium", status: "Pending" },
  { id: "KYC-9049", customer: "Kelvin Boateng", email: "kelvin.b@email.com", country: "Ghana", level: "Level 2", document: "Driver's licence", submitted: "1 hour ago", risk: "High", status: "Pending" },
  { id: "KYC-9048", customer: "Zainab Musa", email: "zainab.m@email.com", country: "Nigeria", level: "Level 2", document: "National ID", submitted: "2 hours ago", risk: "Low", status: "Pending" },
  { id: "KYC-9047", customer: "Michael Dube", email: "michael.d@email.com", country: "South Africa", level: "Level 3", document: "Passport", submitted: "3 hours ago", risk: "Medium", status: "Resubmission" },
];

export const initialPayments: AdminPayment[] = [
  { id: "DEP-78214", customer: "Amina Yusuf", type: "Deposit", method: "Bank transfer", amount: 12500, submitted: "14 minutes ago", status: "Pending", proof: "payment-proof-78214.jpg" },
  { id: "WDR-78213", customer: "Amara Okafor", type: "Withdrawal", method: "USDT · TRC20", amount: 8250, submitted: "22 minutes ago", status: "Pending" },
  { id: "DEP-78212", customer: "Daniel Mensah", type: "Deposit", method: "USDT · ERC20", amount: 5000, submitted: "34 minutes ago", status: "Pending", proof: "tx-hash-0x82f...a71" },
  { id: "WDR-78211", customer: "Grace Wanjiku", type: "Withdrawal", method: "Bank transfer", amount: 3750, submitted: "1 hour ago", status: "Pending" },
  { id: "DEP-78210", customer: "Thandi Mokoena", type: "Deposit", method: "Card", amount: 2200, submitted: "2 hours ago", status: "Approved", proof: "gateway-reference-PSK88210" },
];

export const adminTransactions = [
  ["TXN-480231", "Alex Johnson", "Investment", "Balanced Growth", "$25,000.00", "Completed", "12 Jun 2024 · 14:22"],
  ["TXN-480230", "Amina Yusuf", "Deposit", "Bank transfer", "$12,500.00", "Pending", "12 Jun 2024 · 14:08"],
  ["TXN-480229", "Amara Okafor", "Withdrawal", "USDT · TRC20", "$8,250.00", "Pending", "12 Jun 2024 · 13:50"],
  ["TXN-480228", "Grace Wanjiku", "Staking", "SOL Flexible", "$3,500.00", "Completed", "12 Jun 2024 · 13:14"],
  ["TXN-480227", "Daniel Mensah", "Trade", "ETH/USDT", "$1,840.20", "Completed", "12 Jun 2024 · 12:45"],
  ["TXN-480226", "Ibrahim Bello", "Balance adjustment", "Admin credit", "$500.00", "Flagged", "12 Jun 2024 · 11:34"],
];

export const stakingProducts = [
  ["Ethereum Flexible", "ETH", "6.25%", "1,052", "$3.82M", "Active"],
  ["Solana Flexible", "SOL", "8.35%", "804", "$2.14M", "Active"],
  ["BNB Flexible", "BNB", "5.75%", "428", "$1.03M", "Active"],
  ["Polkadot 30 Days", "DOT", "11.20%", "221", "$684K", "Paused"],
];

export const tradingPositions = [
  ["POS-21084", "Alex Johnson", "BTC/USDT", "Long · 10x", "$68,200.00", "+$1,248.40", "Open"],
  ["POS-21083", "Amara Okafor", "ETH/USDT", "Long · 5x", "$3,480.20", "+$826.15", "Open"],
  ["POS-21082", "Grace Wanjiku", "SOL/USDT", "Short · 3x", "$168.40", "-$215.80", "At risk"],
  ["POS-21081", "Thandi Mokoena", "BNB/USDT", "Long · 2x", "$592.10", "+$184.60", "Open"],
];

export const auditEvents = [
  ["ADM-001", "Sarah Williams", "Approved KYC", "KYC-9046 · Musa Adeyemi", "197.210.54.18", "12 Jun 2024 · 14:18"],
  ["ADM-003", "Michael Chen", "Adjusted balance", "KRV-10476 · +$500 USDT", "102.88.17.41", "12 Jun 2024 · 13:52"],
  ["ADM-001", "Sarah Williams", "Approved withdrawal", "WDR-78209 · $3,200", "197.210.54.18", "12 Jun 2024 · 13:20"],
  ["ADM-005", "Nadia Ibrahim", "Updated investment plan", "PLAN-002 · APY 13.8% → 14.2%", "105.112.82.9", "12 Jun 2024 · 12:45"],
  ["SYSTEM", "Automated control", "Restricted account", "KRV-10476 · Risk threshold", "Internal", "12 Jun 2024 · 11:34"],
];

export const supportTickets = [
  ["TKT-3182", "Daniel Mensah", "KYC document rejected", "KYC", "High", "Open", "8 min ago"],
  ["TKT-3181", "Amina Yusuf", "Deposit pending verification", "Payments", "High", "Open", "21 min ago"],
  ["TKT-3180", "Grace Wanjiku", "Staking reward calculation", "Earn", "Normal", "In progress", "52 min ago"],
  ["TKT-3179", "Alex Johnson", "Unable to export report", "Account", "Normal", "Open", "1 hour ago"],
];
