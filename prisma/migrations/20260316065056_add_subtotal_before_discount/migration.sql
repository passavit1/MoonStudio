-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platformId" INTEGER NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cancelationType" TEXT,
    "subtotalBeforeDiscount" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "shippingFee" REAL NOT NULL DEFAULT 0,
    "orderAmount" REAL NOT NULL DEFAULT 0,
    "buyerUsername" TEXT,
    "province" TEXT,
    "paymentMethod" TEXT,
    "createdTime" DATETIME,
    "paidTime" DATETIME,
    "shippedTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("buyerUsername", "cancelationType", "createdAt", "createdTime", "externalOrderId", "id", "orderAmount", "paidTime", "paymentMethod", "platformId", "province", "shippedTime", "shippingFee", "status", "subtotal", "updatedAt") SELECT "buyerUsername", "cancelationType", "createdAt", "createdTime", "externalOrderId", "id", "orderAmount", "paidTime", "paymentMethod", "platformId", "province", "shippedTime", "shippingFee", "status", "subtotal", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_externalOrderId_key" ON "Order"("externalOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
