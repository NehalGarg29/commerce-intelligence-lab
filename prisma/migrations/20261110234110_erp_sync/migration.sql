-- CreateTable
CREATE TABLE "ErpStock" (
    "variantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "incoming" INTEGER NOT NULL DEFAULT 0,
    "incomingEta" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpStock_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "ErpSyncLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" JSONB,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpOrderExport" (
    "draftOrderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,

    CONSTRAINT "ErpOrderExport_pkey" PRIMARY KEY ("draftOrderId")
);

-- CreateIndex
CREATE INDEX "ErpSyncLog_createdAt_idx" ON "ErpSyncLog"("createdAt");
