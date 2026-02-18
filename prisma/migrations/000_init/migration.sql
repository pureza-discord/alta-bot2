CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "discordId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "avatar" TEXT,
  "mensagens" INTEGER NOT NULL DEFAULT 0,
  "eventos" INTEGER NOT NULL DEFAULT 0,
  "recrutas" INTEGER NOT NULL DEFAULT 0,
  "guerraPontos" INTEGER NOT NULL DEFAULT 0,
  "meritPoints" INTEGER NOT NULL DEFAULT 0,
  "meritStars" INTEGER NOT NULL DEFAULT 0,
  "nivel" TEXT NOT NULL DEFAULT 'Capanga',
  "influencia" INTEGER NOT NULL DEFAULT 0,
  "dinheiro" INTEGER NOT NULL DEFAULT 0,
  "distritoId" TEXT,
  "temporadaId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "User_guildId_discordId_key" ON "User" ("guildId", "discordId");

CREATE TABLE "Distrito" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "pontos" INTEGER NOT NULL DEFAULT 0,
  "capitaoId" TEXT,
  "comandante1Id" TEXT,
  "comandante2Id" TEXT,
  "conselheiroId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "Distrito_guildId_nome_key" ON "Distrito" ("guildId", "nome");
CREATE INDEX "Distrito_guildId_pontos_idx" ON "Distrito" ("guildId", "pontos");

CREATE TABLE "Guerra" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "distritoA" TEXT NOT NULL,
  "distritoB" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "vencedorId" TEXT,
  "startedAt" TIMESTAMP,
  "endedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "Guerra_guildId_status_idx" ON "Guerra" ("guildId", "status");

CREATE TABLE "Evento" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "participantes" TEXT[] NOT NULL DEFAULT '{}',
  "vencedorId" TEXT,
  "criadoPor" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Temporada" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "numero" INTEGER NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "endedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "Temporada_guildId_numero_key" ON "Temporada" ("guildId", "numero");

CREATE TABLE "Medalha" (
  "id" TEXT PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "permanente" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "Medalha_nome_key" ON "Medalha" ("nome");

CREATE TABLE "UserMedalha" (
  "userId" TEXT NOT NULL,
  "medalhaId" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("userId", "medalhaId", "guildId")
);

CREATE TABLE "EconomiaLog" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "valor" INTEGER NOT NULL,
  "descricao" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "EconomiaLog_guildId_createdAt_idx" ON "EconomiaLog" ("guildId", "createdAt");

CREATE TABLE "Recrutamento" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "indicadorId" TEXT NOT NULL,
  "novoMembroId" TEXT NOT NULL,
  "validado" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "Recrutamento_guildId_validado_idx" ON "Recrutamento" ("guildId", "validado");

CREATE TABLE "Contrato" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "metaMensagens" INTEGER NOT NULL,
  "metaRecrutas" INTEGER NOT NULL,
  "recompensa" INTEGER NOT NULL,
  "prazo" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Missao" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "objetivo" INTEGER NOT NULL,
  "recompensa" INTEGER NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Proposta" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdBy" TEXT NOT NULL,
  "votosSim" INTEGER NOT NULL DEFAULT 0,
  "votosNao" INTEGER NOT NULL DEFAULT 0,
  "votantes" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Punishment" (
  "id" TEXT PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "reason" TEXT,
  "duration" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "Punishment_guildId_userId_active_idx" ON "Punishment" ("guildId", "userId", "active");
