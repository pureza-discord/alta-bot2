ALTER TABLE "Contrato" ADD COLUMN "distritoId" TEXT;
ALTER TABLE "Contrato" ADD COLUMN "progressoMensagens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Contrato" ADD COLUMN "progressoRecrutas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Contrato" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE "MissaoDistrito" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "distritoId" TEXT NOT NULL,
  "temporadaId" TEXT,
  "tipo" TEXT NOT NULL,
  "objetivo" INTEGER NOT NULL,
  "progresso" INTEGER NOT NULL DEFAULT 0,
  "recompensa" INTEGER NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "MissaoDistrito_guildId_distritoId_idx" ON "MissaoDistrito" ("guildId", "distritoId");
CREATE INDEX "MissaoDistrito_guildId_temporadaId_idx" ON "MissaoDistrito" ("guildId", "temporadaId");
CREATE INDEX "MissaoDistrito_guildId_ativa_idx" ON "MissaoDistrito" ("guildId", "ativa");
