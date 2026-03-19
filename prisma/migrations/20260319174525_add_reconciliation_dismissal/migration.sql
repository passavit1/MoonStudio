-- CreateTable
CREATE TABLE "ReconciliationDismissal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "note" TEXT,
    "dismissedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationDismissal_key_key" ON "ReconciliationDismissal"("key");
