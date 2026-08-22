export type Asset = {
  rank: number;
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  change7d: number;
  marketCap: string;
  volume: string;
  colour: string;
  data: number[];
};

export const assets: Asset[] = [
  {
    rank: 1,
    symbol: "BTC",
    name: "Bitcoin",
    price: "$68,247.21",
    change24h: 1.42,
    change7d: 4.31,
    marketCap: "$1.34T",
    volume: "$29.6B",
    colour: "#f7931a",
    data: [28, 34, 31, 45, 41, 52, 47, 59, 56, 69, 64, 78],
  },
  {
    rank: 2,
    symbol: "ETH",
    name: "Ethereum",
    price: "$3,512.08",
    change24h: 2.35,
    change7d: 6.72,
    marketCap: "$422.1B",
    volume: "$14.2B",
    colour: "#627eea",
    data: [32, 36, 38, 41, 48, 45, 54, 61, 58, 67, 65, 73],
  },
  {
    rank: 3,
    symbol: "USDT",
    name: "Tether",
    price: "$0.9988",
    change24h: 0.02,
    change7d: 0.01,
    marketCap: "$112.4B",
    volume: "$56.3B",
    colour: "#26a17b",
    data: [48, 49, 48, 50, 49, 50, 49, 50, 51, 50, 50, 51],
  },
  {
    rank: 4,
    symbol: "BNB",
    name: "BNB",
    price: "$577.32",
    change24h: -0.56,
    change7d: 1.22,
    marketCap: "$84.7B",
    volume: "$1.6B",
    colour: "#f3ba2f",
    data: [63, 59, 61, 55, 58, 51, 54, 49, 46, 50, 44, 42],
  },
  {
    rank: 5,
    symbol: "SOL",
    name: "Solana",
    price: "$165.74",
    change24h: 3.18,
    change7d: 8.92,
    marketCap: "$76.5B",
    volume: "$2.3B",
    colour: "#9b6cff",
    data: [23, 29, 27, 38, 44, 40, 52, 49, 61, 67, 64, 76],
  },
  {
    rank: 6,
    symbol: "XRP",
    name: "XRP",
    price: "$0.5279",
    change24h: -1.12,
    change7d: -2.41,
    marketCap: "$28.9B",
    volume: "$1.1B",
    colour: "#d7dde0",
    data: [70, 64, 67, 57, 61, 55, 49, 53, 44, 47, 39, 35],
  },
  {
    rank: 7,
    symbol: "USDC",
    name: "USD Coin",
    price: "$1.0001",
    change24h: 0.01,
    change7d: 0.01,
    marketCap: "$24.8B",
    volume: "$4.6B",
    colour: "#2775ca",
    data: [50, 49, 50, 50, 51, 50, 50, 49, 50, 50, 51, 50],
  },
  {
    rank: 8,
    symbol: "DOGE",
    name: "Dogecoin",
    price: "$0.1402",
    change24h: -2.15,
    change7d: -0.77,
    marketCap: "$20.2B",
    volume: "$615.7M",
    colour: "#c2a633",
    data: [68, 63, 57, 61, 53, 49, 44, 46, 40, 37, 42, 32],
  },
];

export const marketLine = [
  64200, 64800, 65500, 65100, 66300, 66900, 66100, 67400, 66800, 67900, 67300,
  68700, 68100, 68850, 68200, 69100, 68400, 69700, 69200, 70500, 70100, 71300,
  72100, 71800, 73200, 72400, 73900, 74600, 74100, 75800, 75200, 76800,
];

export const navItems = [
  { label: "Markets", href: "/markets" },
  { label: "Insights", href: "/insights" },
  { label: "Trade Tools", href: "/trade-tools" },
  { label: "Learn", href: "/learn" },
  { label: "Company", href: "/company" },
  { label: "Support", href: "/support" },
];

export const news = [
  {
    tag: "Markets",
    time: "10 min ago",
    title: "Ethereum activity reaches a six-month high",
    excerpt: "On-chain demand strengthens as network participation expands.",
    art: "chain",
  },
  {
    tag: "Economy",
    time: "45 min ago",
    title: "Inflation data comes in below forecast",
    excerpt:
      "Core CPI cools, strengthening expectations of a future rate adjustment.",
    art: "economy",
  },
  {
    tag: "Crypto",
    time: "2 hours ago",
    title: "Solana ecosystem value crosses milestone",
    excerpt: "DeFi growth accelerates as user activity reaches new highs.",
    art: "solana",
  },
  {
    tag: "Markets",
    time: "3 hours ago",
    title: "Gold holds firm above important support",
    excerpt: "Safe-haven demand persists amid global macro uncertainty.",
    art: "gold",
  },
];

export const lessons = [
  {
    title: "How Markets Work",
    level: "Beginner",
    time: "15 min",
    desc: "Understand market structure, participants and order flow.",
    accent: "#31c86d",
  },
  {
    title: "Your First Trade",
    level: "Beginner",
    time: "10 min",
    desc: "A clear walkthrough for placing your first crypto trade.",
    accent: "#f3b400",
  },
  {
    title: "Types of Orders",
    level: "Beginner",
    time: "10 min",
    desc: "Learn market, limit and stop orders with confidence.",
    accent: "#8f6cff",
  },
  {
    title: "Chart Timeframes",
    level: "Beginner",
    time: "10 min",
    desc: "Choose a timeframe that matches your trading strategy.",
    accent: "#2fa7df",
  },
];

export const faq = [
  [
    "How do I create a Korvesta account?",
    "Select Get Started, provide your details and confirm the six-digit verification code sent to your email.",
  ],
  [
    "How do I verify my account?",
    "Enter the code sent to your registered email. You can request a new code if it expires.",
  ],
  [
    "Where does Korvesta get its market data?",
    "We combine institutional-quality data from trusted global exchanges and market infrastructure partners.",
  ],
  [
    "How is my account protected?",
    "Use a strong unique password and verify your email with the one-time registration code.",
  ],
  [
    "How do I contact support?",
    "Use the contact form on this page or email support@korvesta.com.",
  ],
];
