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
}

export interface PayrollCalculationResult {
  basicSalary: number;
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

export class PayrollCalculator {
  static calculate(input: PayrollCalculationInput): PayrollCalculationResult {
    const { basicSalary, components, includePersonalRelief } = input;

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

    const grossPay = basicSalary + totalAllowance;
    const chargeableIncome = Math.max(0, grossPay - preTaxDeductions);
    
    let payeTax = this.calculatePAYE(chargeableIncome);
    const relief = includePersonalRelief ? PERSONAL_RELIEF : 0;
    
    // PAYE cannot be negative
    payeTax = Math.max(0, payeTax - relief);

    const netPay = chargeableIncome - payeTax - postTaxDeductions;

    return {
      basicSalary,
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
