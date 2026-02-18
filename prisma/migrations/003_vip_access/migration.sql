CREATE TABLE "VipAccess" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'VIP',
  "expiresAt" TIMESTAMP NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "VipAccess_guildId_userId_key" ON "VipAccess" ("guildId", "userId");
CREATE INDEX "VipAccess_guildId_active_idx" ON "VipAccess" ("guildId", "active");
CREATE INDEX "VipAccess_guildId_expiresAt_idx" ON "VipAccess" ("guildId", "expiresAt");
