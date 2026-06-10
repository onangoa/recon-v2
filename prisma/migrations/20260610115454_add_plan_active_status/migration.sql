/*
  Warnings:

  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `projectId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Metric` table. All the data in the column will be lost.
  - You are about to drop the column `coordinates` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `maxProjects` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Visitor` table. All the data in the column will be lost.
  - Added the required column `siteId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Metric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractorId` to the `Site` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxSites` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Visitor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Project_status_idx";

-- DropIndex
DROP INDEX "Project_contractorId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Project";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "designationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Worker_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Worker_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "minSalary" REAL,
    "maxSalary" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Designation_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "totalGrossPay" REAL NOT NULL DEFAULT 0,
    "totalNetPay" REAL NOT NULL DEFAULT 0,
    "totalDeductions" REAL NOT NULL DEFAULT 0,
    "createdByWorkerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollPeriod_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollPeriod_createdByWorkerId_fkey" FOREIGN KEY ("createdByWorkerId") REFERENCES "Worker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deductionType" TEXT,
    "calculationType" TEXT NOT NULL,
    "amount" REAL,
    "percentage" REAL,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryComponent_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "designationId" TEXT,
    "workingHours" REAL NOT NULL DEFAULT 0,
    "attainedHours" REAL NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "attainedDays" INTEGER NOT NULL DEFAULT 0,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "lateHours" REAL NOT NULL DEFAULT 0,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "leaveHours" REAL NOT NULL DEFAULT 0,
    "leaveDays" INTEGER NOT NULL DEFAULT 0,
    "basicSalary" REAL NOT NULL DEFAULT 0,
    "totalAllowance" REAL NOT NULL DEFAULT 0,
    "totalDeductions" REAL NOT NULL DEFAULT 0,
    "grossPay" REAL NOT NULL DEFAULT 0,
    "chargeableIncome" REAL NOT NULL DEFAULT 0,
    "payeTax" REAL NOT NULL DEFAULT 0,
    "personalRelief" REAL NOT NULL DEFAULT 0,
    "netPay" REAL NOT NULL DEFAULT 0,
    "employerCosts" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "note" TEXT,
    "paymentMethod" TEXT,
    "phoneNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalarySlip_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalarySlip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalarySlip_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalarySlip_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalarySlipDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salarySlipId" TEXT NOT NULL,
    "salaryComponentId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "deductionType" TEXT,
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "amount" REAL NOT NULL DEFAULT 0,
    "percentage" REAL,
    "calculationDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalarySlipDetail_salarySlipId_fkey" FOREIGN KEY ("salarySlipId") REFERENCES "SalarySlip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamMember_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "change" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "type" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fileName" TEXT,
    "fileData" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "materialId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "referenceNumber" TEXT,
    "externalId" TEXT,
    "receiptNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "notes" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("createdAt", "fileUrl", "id", "name", "type", "updatedAt", "uploadedAt") SELECT "createdAt", "fileUrl", "id", "name", "type", "updatedAt", "uploadedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_siteId_idx" ON "Document"("siteId");
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serialNo" TEXT,
    "rentalCost" REAL,
    "dailyRate" REAL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("createdAt", "dailyRate", "id", "name", "rentalCost", "serialNo", "status", "type", "updatedAt") SELECT "createdAt", "dailyRate", "id", "name", "rentalCost", "serialNo", "status", "type", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_siteId_idx" ON "Equipment"("siteId");
CREATE TABLE "new_Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "supplier" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("categoryId", "createdAt", "id", "name", "quantity", "status", "supplier", "totalCost", "unit", "unitCost", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "quantity", "status", "supplier", "totalCost", "unit", "unitCost", "updatedAt" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE INDEX "Material_siteId_idx" ON "Material"("siteId");
CREATE INDEX "Material_categoryId_idx" ON "Material"("categoryId");
CREATE TABLE "new_Metric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Metric_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Metric" ("createdAt", "id", "recordedAt", "type", "unit", "updatedAt", "value") SELECT "createdAt", "id", "recordedAt", "type", "unit", "updatedAt", "value" FROM "Metric";
DROP TABLE "Metric";
ALTER TABLE "new_Metric" RENAME TO "Metric";
CREATE INDEX "Metric_siteId_idx" ON "Metric"("siteId");
CREATE INDEX "Metric_type_idx" ON "Metric"("type");
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("createdAt", "description", "id", "location", "name", "updatedAt") SELECT "createdAt", "description", "id", "location", "name", "updatedAt" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE INDEX "Site_contractorId_idx" ON "Site"("contractorId");
CREATE TABLE "new_SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "maxSites" INTEGER NOT NULL,
    "maxTeamMembers" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SubscriptionPlan" ("createdAt", "features", "id", "maxTeamMembers", "name", "price", "updatedAt") SELECT "createdAt", "features", "id", "maxTeamMembers", "name", "price", "updatedAt" FROM "SubscriptionPlan";
DROP TABLE "SubscriptionPlan";
ALTER TABLE "new_SubscriptionPlan" RENAME TO "SubscriptionPlan";
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "description", "dueDate", "id", "priority", "status", "title", "updatedAt") SELECT "createdAt", "description", "dueDate", "id", "priority", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_siteId_idx" ON "Task"("siteId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE TABLE "new_Visitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "purpose" TEXT NOT NULL,
    "checkInTime" DATETIME NOT NULL,
    "checkOutTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Visitor_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Visitor" ("checkInTime", "checkOutTime", "company", "createdAt", "id", "name", "purpose", "updatedAt") SELECT "checkInTime", "checkOutTime", "company", "createdAt", "id", "name", "purpose", "updatedAt" FROM "Visitor";
DROP TABLE "Visitor";
ALTER TABLE "new_Visitor" RENAME TO "Visitor";
CREATE INDEX "Visitor_siteId_idx" ON "Visitor"("siteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Worker_nationalId_key" ON "Worker"("nationalId");

-- CreateIndex
CREATE INDEX "Worker_contractorId_idx" ON "Worker"("contractorId");

-- CreateIndex
CREATE INDEX "Worker_designationId_idx" ON "Worker"("designationId");

-- CreateIndex
CREATE INDEX "Designation_contractorId_idx" ON "Designation"("contractorId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_contractorId_idx" ON "PayrollPeriod"("contractorId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_createdByWorkerId_idx" ON "PayrollPeriod"("createdByWorkerId");

-- CreateIndex
CREATE INDEX "SalaryComponent_contractorId_idx" ON "SalaryComponent"("contractorId");

-- CreateIndex
CREATE INDEX "SalarySlip_contractorId_idx" ON "SalarySlip"("contractorId");

-- CreateIndex
CREATE INDEX "SalarySlip_payrollPeriodId_idx" ON "SalarySlip"("payrollPeriodId");

-- CreateIndex
CREATE INDEX "SalarySlip_workerId_idx" ON "SalarySlip"("workerId");

-- CreateIndex
CREATE INDEX "SalarySlip_designationId_idx" ON "SalarySlip"("designationId");

-- CreateIndex
CREATE INDEX "SalarySlipDetail_salarySlipId_idx" ON "SalarySlipDetail"("salarySlipId");

-- CreateIndex
CREATE INDEX "SalarySlipDetail_salaryComponentId_idx" ON "SalarySlipDetail"("salaryComponentId");

-- CreateIndex
CREATE INDEX "TeamMember_contractorId_idx" ON "TeamMember"("contractorId");

-- CreateIndex
CREATE INDEX "StockMovement_materialId_idx" ON "StockMovement"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseNumber_key" ON "License"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_externalId_idx" ON "Transaction"("externalId");
