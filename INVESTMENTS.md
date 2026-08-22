# Fixed APY investments

Apply `supabase/migrations/202608210006_fixed_apy_investments.sql`. The implementation uses simple, non-compounding interest with an immutable daily accrual record:

`daily ROI = principal × (APY basis points / 10,000) ÷ 365`

Subscriptions debit the customer's available USDT ledger account and credit their investment account. Daily ROI credits the investment account and creates an equal platform investment liability. Principal plus accrued ROI becomes redeemable only after maturity.

Generate a separate secret and set `INVESTMENT_CRON_SECRET`. Once per day after 00:05 UTC, call:

```text
POST /api/investments/accrue
Authorization: Bearer <INVESTMENT_CRON_SECRET>
```

The job catches up missed days, locks positions while processing, and uses unique accrual dates and idempotent ledger transaction keys. Re-running it for the same date does not credit ROI twice.

Fixed-return products create financial liabilities. Do not activate this publicly until reserves, disclosures, early-termination policy, tax treatment, KYC/AML, jurisdiction eligibility and required licensing have been approved by qualified professionals.
