import type { OvertimeDayType } from './attendance-utils';
import { OVERTIME_DAY_TYPES } from './attendance-utils';

export const TAX_BANDS = [
  { min: 0, max: 24000, rate: 0.10 },      // 10% on first KES 24,000
  { min: 24001, max: 32333, rate: 0.25 },   // 25% on next KES 8,333
  { min: 32334, max: 500000, rate: 0.30 },  // 30% on next KES 467,667
  { min: 500001, max: 800000, rate: 0.325 }, // 32.5% on next KES 300,000
  { min: 800001, max: null, rate: 0.35 },    // 35% on income above KES 800,000
];

export const PERSONAL_RELIEF = 2400.00;

export interface SalaryComponentData {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  deductionType?: 'pre_tax' | 'post_tax' | 'employer_only' | null;
  calculationType: 'fixed' | 'percentage';
  amount?: number | null;
  percentage?: number | null;
  isTaxable: boolean;
  isStatutory: boolean;
}

export interface PayrollCalculationInput {
  basicSalary: number;
  components: SalaryComponentData[];
  includePersonalRelief: boolean;
  /**
   * Attendance-derived figures for the period. When omitted, the calculator
   * pays the full basic salary with no overtime/late adjustment (legacy
   * behaviour). When provided, the basic salary is pro-rated by days worked
   * according to `rate.paymentFrequency`, overtime is paid at the configured
   * rate, and late hours are deducted as an unpaid post-tax deduction.
   */
  attendance?: AttendancePayrollInput;
  rate?: RateConfig;
  /** Shift overtime configuration. When omitted, defaults to 1x hourly rate. */
  overtimeConfig?: {
    rateType: string;   // "hourly" or "fixed"
    rateAmount: number; // multiplier for "hourly", KES/hour for "fixed"
  };
  /**
   * Per-designation overtime rules by day type (see overtime.md #3). Each
   * band's rate resolves as: designation rule → shift config → 1x default.
   */
  overtimeRules?: OvertimeRuleInput[];
}

/** A per-designation day-type overtime rule passed to the calculator. */
export interface OvertimeRuleInput {
  dayType: OvertimeDayType;
  /** "hourly" (rateAmount = multiplier on the hourly rate) or "fixed" (KES/hour). */
  rateType: string;
  rateAmount: number;
  /** Inactive rules are ignored (rate falls back to shift/default). */
  isActive?: boolean;
}

/** One itemised overtime line on the payslip. */
export interface OvertimeBandResult {
  dayType: OvertimeDayType;
  hours: number;
  /** Resolved rate type actually applied. */
  rateType: string;
  /** Multiplier (hourly) or KES/hour (fixed) actually applied. */
  rateAmount: number;
  /** Where the resolved rate came from. */
  source: 'designation' | 'shift' | 'default';
  pay: number;
}

export const OVERTIME_BAND_LABELS: Record<OvertimeDayType, string> = {
  weekday: 'Weekday',
  rest_day: 'Rest Day',
  public_holiday: 'Public Holiday',
};

export interface AttendancePayrollInput {
  overtimeHours: number;
  /**
   * Overtime hours per day type (weekday / rest_day / public_holiday).
   * When omitted, `overtimeHours` is treated as a single weekday band
   * (legacy behaviour — one rate applied to the total).
   */
  overtimeBands?: Partial<Record<OvertimeDayType, number>>;
  lateHours: number;
  lateDays: number;
  /** Days the worker was present (clocked in) during the period. */
  daysWorked: number;
  /** Expected working days in the period (from shift/period). */
  workingDays: number;
  /** Same as daysWorked unless the caller wants to distinguish. */
  attainedDays: number;
  /** Expected working hours across the whole period. */
  workingHours: number;
  /** Actual hours worked (sum of Attendance.totalHours). */
  attainedHours: number;
  leaveDays: number;
  leaveHours: number;
}

export interface RateConfig {
  paymentFrequency: string;
  /** Net shift hours per day (duration minus break). */
  hoursPerDay: number;
  /** Calendar days spanned by the period (used to derive rates). */
  daysInPeriod: number;
  /** Expected working days in the period. */
  expectedDaysInPeriod: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  /** Pro-rated basic salary actually payable for days worked. */
  payableBasic: number;
  hourlyRate: number;
  dailyRate: number;
  overtimePay: number;
  /** Itemised per-day-type overtime lines (empty when no overtime). */
  overtimeBands: OvertimeBandResult[];
  lateDeduction: number;
  totalAllowance: number;
  totalDeductions: number;
  grossPay: number;
  chargeableIncome: number;
  payeTax: number;
  personalRelief: number;
  netPay: number;
  employerCosts: number;
  componentDetails: {
    salaryComponentId: string;
    componentName: string;
    componentType: string;
    deductionType: string | null;
    isStatutory: boolean;
    amount: number;
    percentage: number | null;
  }[];
}

const DEFAULT_OVERTIME_MULTIPLIER = 1; // 1x hourly rate when no shift config.

export class PayrollCalculator {
  static calculate(input: PayrollCalculationInput): PayrollCalculationResult {
    const { basicSalary, components, includePersonalRelief, attendance, rate } = input;

    let totalAllowance = 0;
    let preTaxDeductions = 0;
    let postTaxDeductions = 0;
    let employerCosts = 0;
    const componentDetails: PayrollCalculationResult['componentDetails'] = [];

    components.forEach(comp => {
      let amount = 0;
      if (comp.calculationType === 'fixed') {
        amount = comp.amount || 0;
      } else if (comp.calculationType === 'percentage') {
        amount = (basicSalary * (comp.percentage || 0)) / 100;
      }

      componentDetails.push({
        salaryComponentId: comp.id,
        componentName: comp.name,
        componentType: comp.type,
        deductionType: comp.deductionType || null,
        isStatutory: comp.isStatutory,
        amount,
        percentage: comp.calculationType === 'percentage' ? comp.percentage || 0 : null,
      });

      if (comp.type === 'earning') {
        totalAllowance += amount;
      } else if (comp.type === 'deduction') {
        if (comp.deductionType === 'pre_tax') {
          preTaxDeductions += amount;
        } else if (comp.deductionType === 'post_tax') {
          postTaxDeductions += amount;
        } else if (comp.deductionType === 'employer_only') {
          employerCosts += amount;
        }
      }
    });

    // Derive rates and attendance-adjusted pay.
    const { hourlyRate, dailyRate, payableBasic, overtimePay, overtimeBands, lateDeduction } =
      this.deriveRatesAndPay(basicSalary, attendance, rate, input.overtimeConfig, input.overtimeRules);

    // Add overtime as itemised per-band earnings and lateness as a
    // deduction so they appear as itemised lines on the payslip alongside
    // configured components.
    for (const band of overtimeBands) {
      if (band.pay <= 0) continue;
      totalAllowance += band.pay;
      componentDetails.push({
        salaryComponentId: `overtime-${band.dayType}`,
        componentName: `Overtime Pay (${OVERTIME_BAND_LABELS[band.dayType]})`,
        componentType: 'earning',
        deductionType: null,
        isStatutory: false,
        amount: band.pay,
        percentage: null,
      });
    }
    if (lateDeduction > 0) {
      postTaxDeductions += lateDeduction;
      componentDetails.push({
        salaryComponentId: 'late-deduction',
        componentName: 'Late Hours Deduction',
        componentType: 'deduction',
        deductionType: 'post_tax',
        isStatutory: false,
        amount: lateDeduction,
        percentage: null,
      });
    }

    const grossPay = payableBasic + totalAllowance;
    const chargeableIncome = Math.max(0, grossPay - preTaxDeductions);

    let payeTax = this.calculatePAYE(chargeableIncome);
    const relief = includePersonalRelief ? PERSONAL_RELIEF : 0;

    // PAYE cannot be negative
    payeTax = Math.max(0, payeTax - relief);

    const netPay = chargeableIncome - payeTax - postTaxDeductions;

    return {
      basicSalary,
      payableBasic,
      hourlyRate,
      dailyRate,
      overtimePay,
      overtimeBands,
      lateDeduction,
      totalAllowance,
      totalDeductions: preTaxDeductions + postTaxDeductions,
      grossPay,
      chargeableIncome,
      payeTax,
      personalRelief: relief,
      netPay,
      employerCosts,
      componentDetails,
    };
  }

  /**
   * Derive hourly/daily rates from the flat basic salary using the payment
   * frequency and the period's day/hour expectations, then compute the
   * pro-rated basic pay, overtime pay and late-hour deduction.
   *
   * Overtime is paid per day-type band (weekday / rest_day /
   * public_holiday). Each band's rate resolves as: designation rule →
   * shift config → 1x default. When no band map is supplied the total
   * `overtimeHours` is treated as one weekday band (legacy behaviour, so
   * callers that only aggregate a single number are unchanged).
   */
  private static deriveRatesAndPay(
    basicSalary: number,
    attendance: AttendancePayrollInput | undefined,
    rate: RateConfig | undefined,
    overtimeConfig?: { rateType: string; rateAmount: number },
    overtimeRules?: OvertimeRuleInput[],
  ) {
    // Legacy path — no attendance integration. Pay full basic, no overtime/late.
    if (!attendance || !rate) {
      return {
        hourlyRate: 0,
        dailyRate: 0,
        payableBasic: basicSalary,
        overtimePay: 0,
        overtimeBands: [] as OvertimeBandResult[],
        lateDeduction: 0,
      };
    }

    const frequency = (rate.paymentFrequency || 'monthly').toLowerCase();
    const daysInPeriod = rate.daysInPeriod > 0 ? rate.daysInPeriod : 30;
    const expectedDays = rate.expectedDaysInPeriod > 0 ? rate.expectedDaysInPeriod : daysInPeriod;
    const hoursPerDay = rate.hoursPerDay > 0 ? rate.hoursPerDay : 8;

    let dailyRate: number;
    switch (frequency) {
      case 'daily':
        // The designation salary is the per-day rate.
        dailyRate = basicSalary;
        break;
      case 'weekly':
        dailyRate = basicSalary / (expectedDays || 7);
        break;
      case 'monthly':
      case 'all':
      default:
        // Monthly salary is pro-rated by working days, not calendar days,
        // so a worker who works all expected days receives their full
        // salary. Falls back to calendar days when expected days is 0.
        dailyRate = expectedDays > 0
          ? basicSalary / expectedDays
          : basicSalary / daysInPeriod;
        break;
    }

    const hourlyRate = hoursPerDay > 0 ? dailyRate / hoursPerDay : dailyRate / 8;

    const daysWorked = Math.max(0, attendance.daysWorked || 0);
    const payableBasic = Math.max(0, dailyRate * daysWorked);

    const rulesByDayType = new Map<OvertimeDayType, OvertimeRuleInput>(
      (overtimeRules || [])
        .filter(r => r.isActive !== false && (OVERTIME_DAY_TYPES as readonly string[]).includes(r.dayType))
        .map(r => [r.dayType as OvertimeDayType, r]),
    );

    // Band map when the caller supplied one; otherwise the scalar total
    // is treated as a single weekday band (legacy single-rate behaviour).
    const bandHours: Partial<Record<OvertimeDayType, number>> = attendance.overtimeBands
      ?? { weekday: Math.max(0, attendance.overtimeHours || 0) };

    const overtimeBands: OvertimeBandResult[] = [];
    let overtimePay = 0;
    for (const dayType of OVERTIME_DAY_TYPES) {
      const hours = Math.max(0, bandHours[dayType] || 0);
      if (hours <= 0) continue;

      const rule = rulesByDayType.get(dayType);
      let rateType: string;
      let rateAmount: number;
      let source: OvertimeBandResult['source'];

      if (rule) {
        // Designation rule wins for its day type — applied as configured
        // (a fixed rule of 0 pays 0 by explicit intent).
        rateType = rule.rateType;
        rateAmount = rule.rateAmount;
        source = 'designation';
      } else if (overtimeConfig) {
        // Shift fallback — resolved exactly like the legacy single-rate path.
        if (overtimeConfig.rateType === 'fixed' && overtimeConfig.rateAmount > 0) {
          rateType = 'fixed';
          rateAmount = overtimeConfig.rateAmount;
        } else {
          rateType = 'hourly';
          rateAmount = overtimeConfig.rateAmount > 0
            ? overtimeConfig.rateAmount
            : DEFAULT_OVERTIME_MULTIPLIER;
        }
        source = 'shift';
      } else {
        rateType = 'hourly';
        rateAmount = DEFAULT_OVERTIME_MULTIPLIER;
        source = 'default';
      }

      const pay = rateType === 'fixed'
        ? hours * rateAmount
        : hours * hourlyRate * rateAmount;

      overtimePay += pay;
      overtimeBands.push({ dayType, hours, rateType, rateAmount, source, pay });
    }

    const lateDeduction = Math.max(0, attendance.lateHours || 0) * hourlyRate;

    return { hourlyRate, dailyRate, payableBasic, overtimePay, overtimeBands, lateDeduction };
  }

  private static calculatePAYE(taxableIncome: number): number {
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const band of TAX_BANDS) {
      const bandLimit = band.max ? band.max - band.min + (band.min === 0 ? 0 : 0) : Infinity; // Simplified band calc
      // Proper band calculation:
      // Band 1: 0 - 24,000 @ 10%
      // Band 2: 24,001 - 32,333 (next 8,333) @ 25%
      // Band 3: 32,334 - 500,000 (next 467,667) @ 30%
      // Band 4: 500,001 - 800,000 (next 300,000) @ 32.5%
      // Band 5: Above 800,000 @ 35%
    }

    // Actually, let's do it properly:
    const bands = [
      { limit: 24000, rate: 0.10 },
      { limit: 8333, rate: 0.25 },
      { limit: 467667, rate: 0.30 },
      { limit: 300000, rate: 0.325 },
      { limit: Infinity, rate: 0.35 }
    ];

    let income = taxableIncome;
    for (const band of bands) {
      if (income <= 0) break;
      const taxableInThisBand = Math.min(income, band.limit);
      tax += taxableInThisBand * band.rate;
      income -= taxableInThisBand;
    }

    return tax;
  }
}
