-- Add reminder tracking fields to bookings
ALTER TABLE "bookings" ADD COLUMN "reminderSent24h" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN "reminderSent1h" BOOLEAN NOT NULL DEFAULT false;
