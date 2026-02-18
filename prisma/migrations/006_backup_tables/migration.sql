CREATE TABLE "ChannelBackup" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" INTEGER NOT NULL,
  "categoryId" TEXT,
  "position" INTEGER NOT NULL,
  "permissions" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "ChannelBackup_guildId_createdAt_idx" ON "ChannelBackup" ("guildId", "createdAt");
CREATE INDEX "ChannelBackup_guildId_channelId_idx" ON "ChannelBackup" ("guildId", "channelId");

CREATE TABLE "RoleBackup" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" INTEGER NOT NULL,
  "permissions" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "mentionable" BOOLEAN NOT NULL,
  "hoist" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "RoleBackup_guildId_createdAt_idx" ON "RoleBackup" ("guildId", "createdAt");
CREATE INDEX "RoleBackup_guildId_roleId_idx" ON "RoleBackup" ("guildId", "roleId");
