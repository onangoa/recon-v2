# Comprehensive Payroll System Architecture

## Add workers module 

## 1. Designations (/designations)

### Database Schema
```sql
CREATE TABLE designations (
    id BIGINT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    min_salary DECIMAL(10,2) NULL,
    max_salary DECIMAL(10,2) NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### Model: `Designation`
- **Fillable:** company_id, title, description, salary, is_active
- **Casts:** salary (decimal:2), is_active (boolean)
- **Relationships:** company(), staff(), workers(), salarySlips()
- **Scopes:** active(), byCompany($companyId)

### Controller: DesignationsController`
**Routes:** CRUD operations

**Key Features:**
1. Employee/worker categorization (job roles/departments)
2. Base salary definition per designation
3. Worker assignment for pay grade determination
4. Soft deletes for recovery
5. Multi-tenancy via company_id

---

## 2. Payroll Periods (/payroll-periods)

### Database Schema
```sql
CREATE TABLE payroll_periods (
    id BIGINT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('draft', 'processing', 'completed', 'cancelled') DEFAULT 'draft',
    description TEXT NULL,
    total_employees INT DEFAULT 0,
    total_gross_pay DECIMAL(12,2) DEFAULT 0,
    total_net_pay DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    created_by BIGINT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES workers(id) ON DELETE SET NULL
);
```

### Model: `PayrollPeriod`
- **Fillable:** All period fields + aggregated totals
- **Casts:** dates as date, totals as decimal:2
- **Relationships:** company(), createdBy(), salarySlips()
- **Scopes:** active(), byCompany(), byStatus()
- **Badge Color:** status_badge_color (draft=secondary, processing=warning, completed=success, cancelled=danger)

### Controller: `PayrollPeriodsController`
**Routes:** CRUD + processPayroll() + getSalarySlips() + mobile APIs

**Key Features:**
1. Payroll cycle management (monthly/periodic)
2. Status tracking: draft → processing → completed → cancelled
3. Aggregation of totals across period
4. Cannot delete with salary slips, cannot edit when completed
5. Contains all salary slips for the period

---

## 3. Salary Components (/salary-components)

### Database Schema
```sql
CREATE TABLE salary_components (
    id BIGINT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('earning', 'deduction') NOT NULL,
    deduction_type ENUM('pre_tax', 'post_tax', 'employer_only') NULL,
    calculation_type ENUM('fixed', 'percentage') NOT NULL,
    amount DECIMAL(10,2) NULL,
    percentage DECIMAL(5,2) NULL,
    is_taxable BOOLEAN DEFAULT true,
    is_statutory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### Model: `SalaryComponent`
- **Fillable:** All component fields
- **Casts:** numeric fields as decimal, booleans
- **Scopes:** active(), earnings(), deductions(), preTaxDeductions(), postTaxDeductions(), employerOnlyDeductions(), statutory(), ordered()

### Controller: `SalaryComponentsController`
**Routes:** CRUD + mobile APIs

**Key Features:**
1. **Two types:** Earnings (allowances) vs Deductions
2. **Calculation:** Fixed amount or percentage of base salary
3. **Deduction timing:**
   - **Pre-tax:** Before PAYE (pension, insurance)
   - **Post-tax:** After PAYE (loans, advances)
   - **Employer-only:** Costs borne by employer only
4. Taxability and statutory flags
5. Sort order for payslip display

---

## 4. Salary Slips (/salary-slips)

### Database Schema (Main Table)
```sql
CREATE TABLE salary_slips (
    id BIGINT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    payroll_period_id BIGINT NOT NULL,
    worker_id BIGINT NOT NULL,
    designation_id BIGINT NULL,
    working_hours DECIMAL(8,2) DEFAULT 0,
    attained_hours DECIMAL(8,2) DEFAULT 0,
    working_days INT DEFAULT 0,
    attained_days INT DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    late_hours DECIMAL(8,2) DEFAULT 0,
    late_days INT DEFAULT 0,
    leave_hours DECIMAL(8,2) DEFAULT 0,
    leave_days INT DEFAULT 0,
    basic_salary DECIMAL(10,2) DEFAULT 0,
    total_allowance DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) DEFAULT 0,
    chargeable_income DECIMAL(10,2) DEFAULT 0,
    paye_tax DECIMAL(10,2) DEFAULT 0,
    personal_relief DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    employer_costs DECIMAL(10,2) DEFAULT 0,
    status ENUM('draft', 'processed', 'paid', 'cancelled') DEFAULT 'draft',
    note TEXT NULL,
    payment_method VARCHAR(255) NULL,
    phone_number VARCHAR(20) NULL,
    created_by BIGINT NULL,
    FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (designation_id) REFERENCES designations(id)
);
```

### Database Schema (Details Table)
```sql
CREATE TABLE salary_slip_details (
    id BIGINT PRIMARY KEY,
    salary_slip_id BIGINT NOT NULL,
    salary_component_id BIGINT NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    component_type ENUM('earning', 'deduction') NOT NULL,
    deduction_type ENUM('pre_tax', 'post_tax', 'employer_only') NULL,
    is_statutory BOOLEAN DEFAULT false,
    amount DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) NULL,
    calculation_details TEXT NULL,
    FOREIGN KEY (salary_slip_id) REFERENCES salary_slips(id) ON DELETE CASCADE,
    FOREIGN KEY (salary_component_id) REFERENCES salary_components(id) ON DELETE CASCADE
);
```

### Model: `SalarySlip`
- **Fillable:** All payroll fields including attendance, earnings, deductions, tax
- **Casts:** All numeric fields as decimal, booleans as boolean
- **Relationships:** payrollPeriod(), employee(), designation(), salarySlipDetails()
- **Filtered relationships:** earnings(), deductions(), preTaxDeductions(), postTaxDeductions(), employerOnlyDeductions()

### Controller: `SalarySlipsController`
**Routes:** CRUD + processPayment() + processBulkPayroll() + getAttendanceData()

**Key Methods:**
1. **getAttendanceData()**: Auto-fetches attendance records for worker within period
2. **processPayment()**: Marks slip as paid
3. **processBulkPayroll()**: Initiates M-Pesa B2C payments for all slips in period

**Key Features:**
1. Attendance integration (hours, days, overtime, late, leave)
2. Comprehensive payroll calculations
3. Automatic PAYE tax calculation via PayrollCalculator
4. Status tracking: draft → processed → paid → cancelled
5. M-Pesa B2C integration for bulk payments
6. Duplicate prevention (one slip per worker per period)

---

## 5. Payroll Calculator Service

### Service: `PayrollCalculator`

#### Kenyan PAYE Tax Bands (effective 1 July 2023):
```php
const TAX_BANDS = [
    ['min' => 0, 'max' => 24000, 'rate' => 0.10],      // 10% on first KES 24,000
    ['min' => 24001, 'max' => 32333, 'rate' => 0.25],   // 25% on next KES 8,333
    ['min' => 32334, 'max' => 500000, 'rate' => 0.30],  // 30% on next KES 467,667
    ['min' => 500001, 'max' => 800000, 'rate' => 0.325], // 32.5% on next KES 300,000
    ['min' => 800001, 'max' => null, 'rate' => 0.35],    // 35% on income above KES 800,000
];
const PERSONAL_RELIEF = 2400.00;
```

#### Calculation Flow:

calculatePayroll(SalarySlip, componentData, includePersonalRelief):
  1. Get basic salary from designation
  2. Process components (earnings/deductions)
  3. Calculate total earnings = basic + earnings
  4. Calculate pre-tax deductions
  5. Calculate gross pay = total earnings
  6. Calculate chargeable income = gross - pre-tax deductions
  7. Calculate PAYE tax using progressive bands
  8. Apply personal relief (KES 2,400) if enabled
  9. Calculate post-tax deductions
  10. Calculate net pay = chargeable - PAYE + relief - post-tax
  11. Calculate employer costs
  12. Return comprehensive payroll data