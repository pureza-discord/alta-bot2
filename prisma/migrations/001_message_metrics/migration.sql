CREATE TABLE "MessageMetric" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "districtId" TEXT,
  "categoryId" TEXT,
  "day" TIMESTAMP NOT NULL,
  "hour" INTEGER NOT NULL,
  "messages" INTEGER NOT NULL DEFAULT 0,
  "replies" INTEGER NOT NULL DEFAULT 0,
  "threads" INTEGER NOT NULL DEFAULT 0,
  "engagementScore" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "MessageMetric_guildId_userId_categoryId_day_hour_key"
  ON "MessageMetric" ("guildId", "userId", "categoryId", "day", "hour");

CREATE INDEX "MessageMetric_guildId_day_idx" ON "MessageMetric" ("guildId", "day");
CREATE INDEX "MessageMetric_guildId_districtId_idx" ON "MessageMetric" ("guildId", "districtId");
CREATE INDEX "MessageMetric_guildId_categoryId_idx" ON "MessageMetric" ("guildId", "categoryId");
