export type Asset = { rank:number; symbol:string; name:string; price:string; change24h:number; change7d:number; marketCap:string; volume:string; colour:string; data:number[] };
export const assets: Asset[] = [
 {rank:1,symbol:"UST10Y",name:"US Treasury 10-Year",price:"4.28%",change24h:-.04,change7d:-.11,marketCap:"Sovereign",volume:"Benchmark",colour:"#d9a900",data:[64,63,62,64,61,59,58,60,57,55,54,53]},
 {rank:2,symbol:"UST2Y",name:"US Treasury 2-Year",price:"4.71%",change24h:-.02,change7d:.06,marketCap:"Sovereign",volume:"High",colour:"#3d82f7",data:[48,50,49,51,52,50,53,54,52,55,54,56]},
 {rank:3,symbol:"BND",name:"Vanguard Total Bond Market ETF",price:"$72.84",change24h:.18,change7d:.44,marketCap:"$119.2B AUM",volume:"$325M",colour:"#28c76f",data:[42,43,42,45,46,45,48,47,49,51,50,53]},
 {rank:4,symbol:"AGG",name:"iShares Core US Aggregate Bond ETF",price:"$97.16",change24h:.14,change7d:.39,marketCap:"$113.7B AUM",volume:"$662M",colour:"#8b6cff",data:[44,43,45,46,45,47,48,49,48,50,52,51]},
 {rank:5,symbol:"TLT",name:"iShares 20+ Year Treasury Bond ETF",price:"$92.35",change24h:.62,change7d:1.21,marketCap:"$51.4B AUM",volume:"$3.1B",colour:"#f07b3f",data:[35,37,36,40,42,41,45,47,46,50,52,55]},
 {rank:6,symbol:"SHY",name:"iShares 1–3 Year Treasury Bond ETF",price:"$81.72",change24h:.04,change7d:.12,marketCap:"$24.8B AUM",volume:"$187M",colour:"#25a6b8",data:[49,49,50,50,51,50,51,52,51,52,52,53]},
 {rank:7,symbol:"LQD",name:"iShares Investment Grade Corporate Bond ETF",price:"$108.44",change24h:.31,change7d:.73,marketCap:"$32.6B AUM",volume:"$421M",colour:"#b85ec4",data:[39,41,40,43,45,44,46,47,49,48,51,52]},
 {rank:8,symbol:"TIP",name:"iShares TIPS Bond ETF",price:"$107.82",change24h:-.08,change7d:.22,marketCap:"$18.3B AUM",volume:"$144M",colour:"#d55b62",data:[55,54,55,53,54,52,53,51,52,50,51,50]},
 {rank:9,symbol:"BTC",name:"Bitcoin",price:"$—",change24h:0,change7d:0,marketCap:"Digital asset",volume:"Live",colour:"#f7931a",data:[44,46,43,48,51,49,53,55,52,56,58,57]},
 {rank:10,symbol:"ETH",name:"Ethereum",price:"$—",change24h:0,change7d:0,marketCap:"Digital asset",volume:"Live",colour:"#627eea",data:[42,44,43,46,45,49,48,51,50,53,52,55]}
];
export const marketLine=[98,99,98,100,101,100,102,103,102,104,103,105,106,105,107,108];
export const navItems=[{label:"Bond Markets",href:"/markets"},{label:"Insights",href:"/insights"},{label:"Bond Tools",href:"/trade-tools"},{label:"Learn",href:"/learn"},{label:"Company",href:"/company"},{label:"Support",href:"/support"}];
export const news=[
 {tag:"Treasuries",time:"10 min ago",title:"Treasury yields ease as investors assess the rate outlook",excerpt:"The curve shifts as markets weigh inflation, growth and central-bank guidance.",art:"treasury"},
 {tag:"Economy",time:"45 min ago",title:"Inflation data comes in below forecast",excerpt:"Core inflation cools, strengthening expectations of a future rate adjustment.",art:"economy"},
 {tag:"ETFs",time:"2 hours ago",title:"Bond ETFs attract new defensive allocations",excerpt:"Investors add duration and investment-grade exposure through diversified funds.",art:"etf"},
 {tag:"Credit",time:"3 hours ago",title:"Investment-grade spreads remain resilient",excerpt:"Demand for quality income persists amid global macro uncertainty.",art:"credit"}
];
export const lessons=[
 {title:"How Bond Markets Work",level:"Beginner",time:"15 min",desc:"Understand issuers, maturities, coupons and the role of yield.",accent:"#31c86d"},
 {title:"Your First Treasury",level:"Beginner",time:"10 min",desc:"A practical guide to Treasury bills, notes and bonds.",accent:"#f3b400"},
 {title:"Understanding Bond ETFs",level:"Beginner",time:"12 min",desc:"Learn how bond ETFs package diversified fixed-income exposure.",accent:"#8f6cff"},
 {title:"Duration & Rate Risk",level:"Intermediate",time:"14 min",desc:"See how maturity and duration affect price sensitivity.",accent:"#2fa7df"}
];
export const faq=[["How do I create a Korvesta account?","Select Get Started, provide your details and confirm the verification code sent to your email."],["What fixed-income products does Korvesta cover?","Korvesta focuses on government bonds, Treasury securities, corporate bonds and diversified bond ETFs."],["Where does Korvesta get its market information?","We combine issuer disclosures, regulated market sources and established financial-data infrastructure."],["How is my account protected?","Use a strong unique password and verify your email with the one-time registration code."],["How do I contact support?","Use the contact form on this page or email support@korvesta.com."]];
