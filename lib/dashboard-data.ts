import {
  IconActivity,
  IconChartLine,
  IconCoins,
  IconRobot,
  IconShieldCheck,
} from "@tabler/icons-react";

export const portfolioSeries = [122, 128, 125, 136, 142, 151, 146, 158, 166, 174, 183, 176, 192, 201, 194, 213, 225, 218, 236, 248];
export const marketSeries = [218, 226, 231, 224, 236, 242, 251, 244, 258, 263, 255, 269, 278, 272, 285, 292, 286, 301, 309, 318];
export const demoSeries = [84, 87, 86, 90, 92, 88, 94, 97, 93, 98, 101, 100, 104, 103, 108];

export const dashboardAssets = [
  { name: "Bitcoin", symbol: "BTC", price: "$68,420.50", balance: "2.580000", value: "$176,423.42", change: "+4.21%", colour: "#f7931a" },
  { name: "Ethereum", symbol: "ETH", price: "$3,512.08", balance: "12.450000", value: "$43,704.02", change: "+6.18%", colour: "#627eea" },
  { name: "Tether", symbol: "USDT", price: "$1.0001", balance: "24,500.0000", value: "$24,500.00", change: "+0.01%", colour: "#26a17b" },
  { name: "Solana", symbol: "SOL", price: "$165.74", balance: "235.800000", value: "$39,072.49", change: "+3.75%", colour: "#8b5cf6" },
  { name: "BNB", symbol: "BNB", price: "$598.42", balance: "45.120000", value: "$26,041.46", change: "+2.34%", colour: "#f3ba2f" },
  { name: "XRP", symbol: "XRP", price: "$0.5286", balance: "8,350.00", value: "$4,414.81", change: "+0.85%", colour: "#8b99a5" },
];

export const dashboardMetrics = [
  { label: "Total Profit / Loss", value: "+$68,420.30", change: "+38.21% all time", icon: IconChartLine, colour: "#ffc400" },
  { label: "Today's Gain", value: "+$4,892.21", change: "+2.01%", icon: IconActivity, colour: "#00d084" },
  { label: "Staking Rewards", value: "+$1,250.80", change: "This month", icon: IconCoins, colour: "#8b5cf6" },
  { label: "24h Trading Volume", value: "$35.68M", change: "+8.32%", icon: IconRobot, colour: "#2f80ed" },
];

export const notifications = [
  { title: "Buy Order Filled", copy: "Your order for 0.5 BTC at $67,890 has been filled", time: "2m ago", category: "Trade Alerts", icon: IconActivity, colour: "#00d084" },
  { title: "Staking Reward Received", copy: "You earned 0.0254 ETH from ETH staking", time: "15m ago", category: "Staking", icon: IconCoins, colour: "#00c2a8" },
  { title: "Price Alert Triggered", copy: "BTC/USDT is above $68,500", time: "25m ago", category: "Price Alerts", icon: IconChartLine, colour: "#f7931a" },
  { title: "AI Bot Profit", copy: "Korvesta AI Pro made +2.45% profit on BTC/USDT", time: "1h ago", category: "Bot Alerts", icon: IconRobot, colour: "#8b5cf6" },
  { title: "New Login Detected", copy: "Chrome on Windows · Lagos, Nigeria", time: "2h ago", category: "Security", icon: IconShieldCheck, colour: "#ef4444" },
];

export const transactions = [
  ["Deposit", "USDT", "+1,200.00", "Completed", "Jun 12, 2024 14:22"],
  ["Withdrawal", "BTC", "-0.0500", "Completed", "Jun 12, 2024 11:20"],
  ["Trade", "ETH/USDT", "+0.1500 ETH", "Completed", "Jun 12, 2024 10:15"],
  ["Staking Reward", "SOL", "+5.2500 SOL", "Completed", "Jun 11, 2024 08:49"],
  ["Bot Profit", "BTC", "+0.00154 BTC", "Completed", "Jun 11, 2024 02:15"],
  ["Transfer", "USDT", "-200.00", "Completed", "Jun 10, 2024 19:30"],
  ["P2P Sell", "USDT", "-150.00", "Completed", "Jun 10, 2024 16:10"],
];

export const bots = [
  ["Alpha Hunter", "Grid Trading", "BTC/USDT", "$5,000", "+$1,245.60", "Active"],
  ["ETH Maximizer", "Trend Following", "ETH/USDT", "$4,200", "+$876.40", "Active"],
  ["Scalper X", "Scalping", "SOL/USDT", "$3,000", "+$542.10", "Active"],
  ["Swing Pro", "Swing Trading", "BNB/USDT", "$3,500", "+$312.50", "Active"],
  ["Mean Reverter", "Mean Reversion", "XRP/USDT", "$2,500", "+$221.30", "Active"],
];

export const earnAssets = [
  ["Ethereum", "ETH", "6.25%", "0.1 ETH", "Flexible", "Low"],
  ["Solana", "SOL", "8.35%", "1 SOL", "Flexible", "Medium"],
  ["BNB", "BNB", "5.75%", "0.5 BNB", "Flexible", "Low"],
  ["Cardano", "ADA", "4.90%", "10 ADA", "Flexible", "Low"],
  ["Polkadot", "DOT", "11.20%", "5 DOT", "30 Days", "Medium"],
];

export const traders = [
  ["CryptoMaster", "+78.45%", "$20,412.32", "82.3%", "12,456", "7/10"],
  ["MoonHunter", "+54.12%", "$18,220.45", "76.8%", "8,905", "6/10"],
  ["TrendWizard", "+41.12%", "$12,490.21", "71.5%", "6,231", "5/10"],
  ["AlphaWhale", "+31.20%", "$9,850.10", "68.9%", "4,023", "4/10"],
  ["ScalpingG", "+28.46%", "$7,120.32", "69.2%", "3,152", "8/10"],
];
