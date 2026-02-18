CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorId" TEXT,
  "targetId" TEXT,
  "source" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "meta" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "AuditLog_guildId_action_idx" ON "AuditLog" ("guildId", "action");
CREATE INDEX "AuditLog_guildId_createdAt_idx" ON "AuditLog" ("guildId", "createdAt");
