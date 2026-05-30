-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('elevator', 'escalator', 'compressor');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('new', 'acknowledged', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('fixed', 'false_alarm', 'known_issue', 'deferred', 'cannot_reproduce');

-- CreateEnum
CREATE TYPE "TimelineAction" AS ENUM ('created', 'acknowledged', 'assigned', 'note', 'resolved', 'dismissed', 'reopened', 'recovered');

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "company" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "floor_count" INTEGER,
    "installed_date" DATE NOT NULL,
    "reading_types" TEXT[],
    "alert_thresholds" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "ts_utc" TIMESTAMP(3) NOT NULL,
    "is_breach" BOOLEAN NOT NULL DEFAULT false,
    "breach_bound" TEXT,
    "breach_limit" DOUBLE PRECISION,
    "content_hash" TEXT NOT NULL,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "threshold" DOUBLE PRECISION,
    "reading_value" DOUBLE PRECISION,
    "reading_name" TEXT,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "recovered_at" TIMESTAMP(3),
    "status" "AlertStatus" NOT NULL DEFAULT 'new',
    "assigned_to_id" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution_type" "ResolutionType",
    "resolution_root_cause" TEXT,
    "resolution_action_taken" TEXT,
    "resolution_preventive_measures" TEXT,
    "resolution_time_spent_minutes" INTEGER,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_timeline" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "TimelineAction" NOT NULL,
    "user_name" TEXT,
    "note" TEXT,
    "details" JSONB,

    CONSTRAINT "alert_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rejected_messages" (
    "id" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "message_type" TEXT,
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rejected_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "devices_company_idx" ON "devices"("company");

-- CreateIndex
CREATE UNIQUE INDEX "users_token_key" ON "users"("token");

-- CreateIndex
CREATE INDEX "users_company_idx" ON "users"("company");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_readings_content_hash_key" ON "sensor_readings"("content_hash");

-- CreateIndex
CREATE INDEX "sensor_readings_device_id_metric_ts_utc_idx" ON "sensor_readings"("device_id", "metric", "ts_utc");

-- CreateIndex
CREATE INDEX "sensor_readings_device_id_ts_utc_idx" ON "sensor_readings"("device_id", "ts_utc");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_content_hash_key" ON "alerts"("content_hash");

-- CreateIndex
CREATE INDEX "alerts_company_status_idx" ON "alerts"("company", "status");

-- CreateIndex
CREATE INDEX "alerts_device_id_idx" ON "alerts"("device_id");

-- CreateIndex
CREATE INDEX "alerts_assigned_to_id_idx" ON "alerts"("assigned_to_id");

-- CreateIndex
CREATE INDEX "alert_timeline_alert_id_timestamp_idx" ON "alert_timeline"("alert_id", "timestamp");

-- CreateIndex
CREATE INDEX "rejected_messages_reason_idx" ON "rejected_messages"("reason");

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_timeline" ADD CONSTRAINT "alert_timeline_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
