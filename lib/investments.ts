export function calculateSimpleDailyAccrual(
  principal: number,
  apyBps: number,
  days = 1,
) {
  if (
    !Number.isFinite(principal) ||
    principal < 0 ||
    !Number.isInteger(apyBps) ||
    apyBps < 0 ||
    !Number.isInteger(days) ||
    days < 0
  )
    throw new Error("Invalid accrual inputs.");
  return principal * (apyBps / 10000) * (days / 365);
}
