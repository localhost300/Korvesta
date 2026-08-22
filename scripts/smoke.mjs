const origin = process.env.KORVESTA_TEST_URL ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const market = await fetch(`${origin}/markets`);
const marketHtml = await market.text();
assert(market.ok, "Markets page did not load.");
assert(marketHtml.includes("interactive candlestick chart"), "Interactive candlestick chart container was not rendered.");
assert(market.headers.get("x-frame-options") === "DENY", "Security headers are missing.");

for (const [path, destination] of [["/dashboard", "/sign-in"], ["/admin", "/admin-sign-in"]]) {
  const response = await fetch(`${origin}${path}`, { redirect: "manual" });
  assert(response.status === 307, `${path} should be protected.`);
  assert(new URL(response.headers.get("location"), origin).pathname === destination, `${path} redirected to the wrong sign-in route.`);
}

for (const path of ["/legal/terms", "/legal/privacy", "/legal/cookies", "/robots.txt", "/sitemap.xml"]) {
  const response = await fetch(`${origin}${path}`);
  assert(response.ok, `${path} did not load.`);
}

console.log("Korvesta smoke checks passed.");
