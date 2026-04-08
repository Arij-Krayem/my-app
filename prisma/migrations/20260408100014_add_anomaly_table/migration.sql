/*
  Warnings:

  - You are about to drop the column `anomalyScore` on the `Anomaly` table. All the data in the column will be lost.
  - You are about to drop the column `dateEnd` on the `Anomaly` table. All the data in the column will be lost.
  - You are about to drop the column `dateStart` on the `Anomaly` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `Anomaly` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Anomaly` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `Anomaly` table. All the data in the column will be lost.
  - Added the required column `date` to the `Anomaly` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Anomaly` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zScore` to the `Anomaly` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Anomaly_brandId_createdAt_idx";

-- DropIndex
DROP INDEX "Anomaly_brandId_entityType_entityId_idx";

-- AlterTable
ALTER TABLE "Anomaly" DROP COLUMN "anomalyScore",
DROP COLUMN "dateEnd",
DROP COLUMN "dateStart",
DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "reason",
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'python',
ADD COLUMN     "pctChange" DOUBLE PRECISION,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "uploadId" TEXT,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "zScore" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
