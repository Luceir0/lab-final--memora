-- CreateTable
CREATE TABLE "SpikeNote" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpikeNote_pkey" PRIMARY KEY ("id")
);
