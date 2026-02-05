-- CreateTable
CREATE TABLE IF NOT EXISTS "availability_slots" (
    "id" TEXT NOT NULL,
    "availabilityLinkId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_availabilityLinkId_fkey" FOREIGN KEY ("availabilityLinkId") REFERENCES "availability_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
