# Overtime Calculation Options — ReconSMI

Per-designation overtime calculation. **Option #3 is implemented** (see
"Implementation notes" at the bottom). This catalog captures the options,
the recommendation, and where the effort sits.

## Current state (why OT is not per-designation today)

| Concern | Where | Driven by |
|---|---|---|
| OT **hours** (when OT counts) | `computeWorkedHours()` in `lib/attendance-utils.ts` | Worker's **Shift** (`allowOvertime`, `overtimeThresholdMinutes` grace past shift end) |
| OT **pay** (what it pays) | `deriveRatesAndPay()` in `lib/payroll-calculator.ts` | `overtimeConfig` passed by callers — sourced from `worker.shift` only (`rateType`: `hourly` multiplier \| `fixed` KES/hr) |
| Hourly-rate basis | Same calculator | **Designation** (`salary` + `paymentFrequency`) |
| Callers | payroll-periods + salary-slips routes (web + mobile, 4 routes) | Pass `worker.shift` as `overtimeConfig` |

So today: rate basis = designation, OT policy = shift. `Designation` has no
OT fields. Two workers with the same designation but different shifts get
different OT rules.

## Options

| # | Approach | Schema change | How it works | Effort |
|---|----------|--------------|--------------|--------|
| 1 | **OT fields on `Designation`** — `allowOvertime`, `overtimeThresholdMinutes`, `overtimeRateType`, `overtimeRateAmount` (nullable) | 4 nullable columns + migration | Payroll resolves OT config **designation-first, shift fallback**, then 1x default. Threshold likewise designation→shift in the per-worker recompute | Low |
| 2 | **Shared `OvertimePolicy` model** — named policy (e.g. "Statutory 1.5x") with rate/threshold; `Designation.overtimePolicyId` FK | New table + FK + migration | Reusable across designations; edit one policy → all linked designations update. Extra CRUD page + policy picker on designation form | Medium |
| 3 | **Per-designation OT rules with day types** — `OvertimeRule` per designation: `dayType` (weekday / rest_day / public_holiday), `rateType`, `rateAmount`, `capHoursPerDay` | Rules table + FK + migration | Matches Kenyan practice (1.5x weekdays, 2x rest days/holidays). Attendance recomputation buckets OT hours by day type; payroll picks the matching rule per day; payslip itemizes per band. Needs a holiday source | High |

## Recommendation: #3

- **Domain-correct for Kenya** — 1.5x weekdays, 2x rest days/holidays is how
  statutory OT works; construction sites run weekends/holidays constantly.
  A flat per-designation rate (#1/#2) pays Sunday OT wrong → compliance gap.
- **Real per-designation granularity** — rate + threshold + cap per day type
  per designation, not one number.
- **Itemized payslips per band** (e.g. "OT Weekday 1.5x × 4h, OT Sunday 2x ×
  2h") — better for audits and disputes.

Pick #1 only if you need it shipped this week with a single rate per
designation (duplicates config; gets superseded). Pick #2 only if many
designations share identical rules AND day-type rates are never needed.

## Where the effort in #3 actually is

The rules table itself is easy (one model + fields on the designation form).
The cost is in the hours pipeline:

1. **Day-type bucketing of OT hours (the big one)** —
   `computeWorkedHours()` currently returns one `overtimeHours` number per
   punch pair; `aggregateAttendance()` sums it into one total the calculator
   consumes. For #3, hours must be split into weekday / rest-day / holiday
   buckets from raw check-in/check-out timestamps at payroll time;
   `aggregateAttendance` + `AttendancePayrollInput` become a band map.
   Policy edge cases the current model doesn't answer:
   - overnight shifts where OT spans midnight into a Sunday — which band?
   - worker punching in on a non-working day — currently 0 OT; with day types
     arguably 100% rest-day OT
   - threshold grace windows crossing day boundaries
2. **Holiday source** — new `Holiday` table + CRUD + seeding Kenya's gazetted
   dates (they shift yearly — Easter-relative, Sunday-rollover); every payroll
   run must match attendance dates against it.
3. **Calculator + payslip changes** — `deriveRatesAndPay()` applies one rate
   to one total; must loop bands, apply each rule (multiplier | fixed | cap),
   emit itemized lines. `SalarySlip` needs a banded breakdown (JSON or
   columns) instead of the single `overtimeHours`.
4. **Caller surface area** — payroll recomputation loop, payroll-periods +
   salary-slips routes (web + mobile), payslip UI, designation form +
   designations API (web + mobile).

## Lean plan for #3 (trims high → medium)

- `dayType` limited to `weekday | rest_day | public_holiday`
- Holidays: simple seeded `Holiday` table (Kenya gazetted dates), editable,
  no fancy CRUD UI
- Rules managed **inline on the designation form** (no separate rules page)
- Bucket hours **at payroll recompute time only** — do not touch the
  biometric webhook write path (Attendance keeps its single `overtimeHours`
  column)
- Shift OT config stays as fallback; precedence:
  designation rule → shift config → 1x default
- Payslip: banded breakdown stored as JSON on the slip; itemized lines on the
  slip UI

## Cross-cutting decisions (whichever option)

- Precedence: designation → shift → default (keeps existing shift data valid)
- Does the **threshold/allowOvertime** (when OT counts) move to designation
  too, or only the **rate** (what it pays)?
- Payslip itemization of the applied rule
- Migration + `prisma generate` + `prisma migrate deploy` (DB was offline
  when last checked — see saved-payments.md note)

## Implementation notes (Option #3, lean plan)

Implemented as per the lean plan above. Schema: `OvertimeRule` (per
designation + day type, unique on `[designationId, dayType]`), `Holiday`
(per contractor, seeded with Kenya's gazetted 2026/2027 dates, editable via
`/web/api/holidays` — GET/POST/DELETE, no CRUD page), and
`SalarySlip.overtimeBands` (JSON breakdown).

**Policy decisions (the edge cases called out above):**

- **Banding rule** — the OT window is split at local midnight and each
  piece is banded by the calendar day it falls on. Overnight OT bleeding
  into a Sunday lands in the rest-day band.
- **Rest day / holiday engagement** — when the designation has an active
  rule for that day type, ALL worked hours that day count as OT in that
  band (statutory practice). Without a matching rule the legacy window
  (past shift end + threshold) applies, so legacy payouts are unchanged.
- **Threshold/allowOvertime stays on the shift** (the "when OT counts"
  half did NOT move to designation — only rates and caps are
  per-designation). `allowOvertime = false` on the shift disables OT
  entirely, including rest-day engagements.
- **Rest-day detection** — the shift's `workingDays` mask decides; with no
  mask configured, Sunday is the rest day.
- **No shift → no OT** (unchanged).
- **Caps** — `capHoursPerDay` caps each band per attendance record at
  bucketing time (payroll recompute only).
- **Rate resolution per band** — designation rule → shift config → 1x
  default. A designation rule applies as configured (a `fixed` rule of 0
  pays 0 by intent); the shift fallback resolves exactly like the legacy
  single-rate path.
- **Payslips** — one itemised earning line per band
  ("Overtime Pay (Rest Day)") plus the JSON breakdown on the slip
  (`SalarySlip.overtimeBands`), rendered as itemised lines on the slip
  dialog. Manual slip creation (`salary-slips` routes) accepts an optional
  `overtimeBands` map in the body; without it the total is paid as one
  weekday band.
- **Designation form/API** — rules are managed inline on the designation
  form (web); the API (web + mobile) accepts `overtimeRules` on
  create/update. PUT only replaces rules when the key is present, so
  clients that don't know about rules (Flutter) keep them.
- **Biometric write path untouched** — Attendance keeps its single
  `overtimeHours` column; bucketing happens at payroll recompute time only
  (`aggregateAttendanceWithBands`).

**Still pending:** `prisma migrate deploy` (DB was offline when the
migration `20260913000000_overtime_rules_holidays` was written; the client
was regenerated so the app is type-ready once the migration is applied),
and a UI for holiday management (API-only for now, per the lean plan).
