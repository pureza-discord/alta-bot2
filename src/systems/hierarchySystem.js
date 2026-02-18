import { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { buildEmbed } from "../utils/embed.js";

export const DISTRICTS = ["Birmingham", "Londres", "Brasil"];
const DISTRICT_ROLE_SET = (district) => [
    `Distrito ${district}`,
    `Capitão ${district}`,
    `Comandante ${district}`,
    `Conselheiro ${district}`,
    `Membro ${district}`
];

export const ROLE_ORDER = [
    "Dono Supremo",
    "Dev Alta",
    "Sub Dono",
    "Conselho da Cúpula",
    "Administração Alta",
    "Guardian",
    "Moderador Oficial",
    "🤖 Bots",
    ...DISTRICTS.flatMap(DISTRICT_ROLE_SET),
    "Capanga",
    "Soldado",
    "Sicario",
    "Linha de Frente",
    "Alto Escalão",
    "Elite",
    "Executor",
    "Oráculo",
    "Chanceler",
    "Lendário",
    "Fundador",
    "Digno de Glória",
    "Mafioso Golden",
    "Influencer Alta",
    "Booster Cúpula",
    "Parceiro Oficial",
    "Parceiro Suprema – Pureza",
    "Doll Syndicate",
    "Equipe Design",
    "Equipe Eventos",
    "Equipe Recrutamento",
    "Equipe Acolhimento",
    "Equipe Social Media",
    "Equipe Passtime",
    "Equipe Mov Chat"
];

export const CATEGORY_STRUCTURE = [
    {
        name: "📌 GERAL",
        channels: ["verifique-se", "chat-geral", "comandos", "memes", "imagens", "edits"],
        restrictedTo: []
    },
    {
        name: "⚔ GUERRAS",
        channels: ["explicação-guerra", "ranking-distritos", "ranking-individual", "registro-de-guerras"],
        restrictedTo: []
    },
    ...DISTRICTS.map((district) => ({
        name: `⚔ ${district}`,
        channels: ["chat-distrito", "estratégia"],
        restrictedTo: DISTRICT_ROLE_SET(district)
    })),
    {
        name: "📢 ADMINISTRAÇÃO",
        channels: ["anuncie-eventos", "metas", "hierarquia", "planejamento"],
        restrictedTo: ["Dono Supremo", "Dev Alta", "Sub Dono", "Conselho da Cúpula", "Administração Alta"]
    },
    {
        name: "🎯 RECRUTAMENTO",
        channels: ["guia-rec", "metas-rec", "avisos-rec"],
        restrictedTo: ["Equipe Recrutamento", "Administração Alta", "Conselho da Cúpula", "Sub Dono", "Dono Supremo", "Dev Alta"]
    },
    {
        name: "🎨 DESIGN",
        channels: ["design"],
        restrictedTo: ["Equipe Design", "Administração Alta", "Dono Supremo", "Dev Alta"]
    },
    {
        name: "📱 SOCIAL MEDIA",
        channels: ["social-media"],
        restrictedTo: ["Equipe Social Media", "Administração Alta", "Dono Supremo", "Dev Alta"]
    },
    {
        name: "🤝 PARCERIAS",
        channels: ["divulgação", "parcerias", "pureza-oficial"],
        restrictedTo: []
    },
    {
        name: "🎮 PASSTIME",
        channels: ["alta-vote", "alta-blog", "alta-fix", "alta-dark", "queridometro"],
        restrictedTo: []
    },
    {
        name: "🔒 SUPORTE",
        channels: ["ticket", "ticket-log"],
        restrictedTo: []
    },
    {
        name: "🔒 LOGS",
        channels: ["logs-mensagens", "logs-cargos", "logs-canais", "logs-punições", "logs-call", "logs-bans", "logs-boost"],
        restrictedTo: ["Dono Supremo", "Dev Alta", "Sub Dono", "Conselho da Cúpula", "Administração Alta"]
    },
    {
        name: "💋 Dolls Syndicate",
        channels: ["💋-dolls"],
        restrictedTo: ["Doll Syndicate", "Administração Alta", "Dono Supremo", "Dev Alta"]
    }
];

function normalizeName(name) {
    return name.toLowerCase().replace(/\s+/g, "");
}

function getRolePermissions(roleName) {
    const adminPerms = [PermissionsBitField.Flags.Administrator];
    const managementPerms = [
        PermissionsBitField.Flags.ManageGuild,
        PermissionsBitField.Flags.ManageRoles,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageEvents,
        PermissionsBitField.Flags.KickMembers,
        PermissionsBitField.Flags.BanMembers,
        PermissionsBitField.Flags.ModerateMembers
    ];
    if (["Dono Supremo", "Dev Alta"].includes(roleName)) {
        return adminPerms;
    }
    if (["Sub Dono"].includes(roleName)) {
        return managementPerms;
    }
    if (["Administração Alta"].includes(roleName)) {
        return [
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.ModerateMembers,
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.ManageEvents
        ];
    }
    if (["Conselho da Cúpula"].includes(roleName)) {
        return [
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.ModerateMembers
        ];
    }
    return [];
}

function getDistrictRolePermissions(roleName) {
    if (roleName.startsWith("Capitão")) {
        return [
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.CreatePublicThreads,
            PermissionsBitField.Flags.CreatePrivateThreads
        ];
    }
    if (roleName.startsWith("Comandante")) {
        return [PermissionsBitField.Flags.ManageMessages];
    }
    return [];
}

export async function syncRoles(guild) {
    await guild.roles.everyone.setPermissions([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
    ]);

    const roleMap = new Map();
    for (const role of guild.roles.cache.values()) {
        roleMap.set(normalizeName(role.name), role);
    }

    const managedRoles = new Set(
        guild.roles.cache.filter((role) => role.managed).map((role) => role.id)
    );

    const createdRoles = [];
    for (const roleName of ROLE_ORDER) {
        const key = normalizeName(roleName);
        const existing = roleMap.get(key);
        if (existing) {
            if (existing.name !== roleName) {
                await existing.setName(roleName);
            }
            const perms = getRolePermissions(roleName);
            const districtPerms = getDistrictRolePermissions(roleName);
            const finalPerms = perms.length > 0 ? perms : districtPerms;
            if (finalPerms.length > 0) {
                await existing.setPermissions(finalPerms);
            }
            createdRoles.push(existing);
        } else {
            const role = await guild.roles.create({
                name: roleName,
                permissions: getRolePermissions(roleName).length > 0
                    ? getRolePermissions(roleName)
                    : getDistrictRolePermissions(roleName)
            });
            createdRoles.push(role);
        }
    }

    const keepSet = new Set(createdRoles.map((role) => role.id));
    for (const role of guild.roles.cache.values()) {
        if (role.id === guild.roles.everyone.id) continue;
        if (managedRoles.has(role.id)) continue;
        if (!keepSet.has(role.id)) {
            await role.delete("Reorganização automática de cargos.");
        }
    }

    const ordered = [...createdRoles].reverse();
    let position = guild.roles.cache.size - 1;
    for (const role of ordered) {
        await role.setPosition(position);
        position -= 1;
    }

    return createdRoles;
}

export async function syncCategories(guild, rolesByName) {
    const keepCategoryNames = CATEGORY_STRUCTURE.map((cat) => normalizeName(cat.name));
    for (const channel of guild.channels.cache.values()) {
        if (channel.type === ChannelType.GuildCategory) {
            const key = normalizeName(channel.name);
            if (!keepCategoryNames.includes(key)) {
                await channel.delete("Reorganização automática de categorias.");
            }
        }
    }

    const keepChannels = new Set(
        CATEGORY_STRUCTURE.flatMap((cat) => cat.channels.map((ch) => normalizeName(ch)))
    );
    for (const channel of guild.channels.cache.values()) {
        if (channel.type === ChannelType.GuildCategory) continue;
        if (!keepChannels.has(normalizeName(channel.name))) {
            await channel.delete("Limpeza automática de canais.");
        }
    }

    for (const categoryConfig of CATEGORY_STRUCTURE) {
        const category =
            guild.channels.cache.find(
                (ch) =>
                    ch.type === ChannelType.GuildCategory &&
                    normalizeName(ch.name) === normalizeName(categoryConfig.name)
            ) ||
            (await guild.channels.create({
                name: categoryConfig.name,
                type: ChannelType.GuildCategory
            }));

        if (categoryConfig.restrictedTo.length > 0) {
            const overwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                }
            ];
            for (const roleName of categoryConfig.restrictedTo) {
                const role = rolesByName.get(roleName);
                if (role) {
                    overwrites.push({
                        id: role.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    });
                }
            }
            await category.permissionOverwrites.set(overwrites);
        }

        for (const channelName of categoryConfig.channels) {
            const existing = guild.channels.cache.find(
                (ch) =>
                    ch.parentId === category.id &&
                    normalizeName(ch.name) === normalizeName(channelName)
            );
            if (!existing) {
                await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id
                });
            }
        }
    }

    await applySpecialPermissions(guild, rolesByName);
    await ensureContainers(guild);
}

export async function reorganizeStructure(guild) {
    const roles = await syncRoles(guild);
    const rolesByName = new Map(roles.map((role) => [role.name, role]));
    await syncCategories(guild, rolesByName);
}

async function applySpecialPermissions(guild, rolesByName) {
    const dollsRole = rolesByName.get("Doll Syndicate");
    const dollsChannel = guild.channels.cache.find((ch) => normalizeName(ch.name) === "💋-dolls");
    if (dollsChannel && dollsRole) {
        await dollsChannel.permissionOverwrites.set([
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: dollsRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]);
    }

    for (const district of DISTRICTS) {
        const category = guild.channels.cache.find(
            (ch) => ch.type === ChannelType.GuildCategory && normalizeName(ch.name) === normalizeName(`⚔ ${district}`)
        );
        if (!category) continue;
        const roleIds = DISTRICT_ROLE_SET(district)
            .map((roleName) => rolesByName.get(roleName)?.id)
            .filter(Boolean);
        await category.permissionOverwrites.set([
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            ...roleIds.map((id) => ({
                id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            }))
        ]);
    }
}

export async function ensureContainers(guild) {
    await sendContainerEmbed(guild, "parcerias", buildEmbed({
        title: "🤝 PARCEIRA SUPREMA",
        description: "**Pureza Discord**\ndiscord.gg/pureza",
        color: "#c6a95f"
    }));

    await sendContainerEmbed(guild, "explicação-guerra", buildEmbed({
        title: "⚔ SISTEMA OFICIAL DE GUERRA DA ALTA ⚔",
        description:
            "• Distritos desafiam outros via comando\n" +
            "• Admin aprova guerra\n" +
            "• Guerra dura 3 dias\n" +
            "• Pontuação automática\n\n" +
            "**Pontuação**\n" +
            "+1 por mensagem válida\n" +
            "+5 por recruta validado\n" +
            "+10 por evento vencido\n" +
            "+20 por meta semanal cumprida\n" +
            "+100 bônus vitória",
        color: "#c6a95f"
    }));

    const metasEmbed = buildEmbed({
        title: "🎯 METAS DE PROMOÇÃO",
        description:
            "**INICIANTE → MEDIANO**\n500 mensagens • 2 eventos • 1 recruta\n\n" +
            "**MEDIANO → ACIMA DA MÉDIA**\n1500 mensagens • 5 eventos • 3 recrutas • 1 guerra\n\n" +
            "**ACIMA DA MÉDIA → SUPERIOR**\n3000 mensagens • 8 eventos • 5 recrutas • 3 guerras\n\n" +
            "**SUPERIOR → POSSES PRZ**\n10.000 mensagens + avaliação manual",
        color: "#c6a95f"
    });
    const progressButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("metas_progress")
            .setLabel("Ver meu progresso")
            .setStyle(ButtonStyle.Secondary)
    );
    await sendContainerEmbed(guild, "metas", metasEmbed, [progressButton]);

    const hierarchyEmbed = buildEmbed({
        title: "👑 HIERARQUIA OFICIAL",
        description: ROLE_ORDER.filter((name) => !name.startsWith("Distrito") && !name.startsWith("Capitão") && !name.startsWith("Comandante") && !name.startsWith("Conselheiro") && !name.startsWith("Membro")).join("\n"),
        color: "#c6a95f"
    });
    await sendContainerEmbed(guild, "hierarquia", hierarchyEmbed);

    const ticketEmbed = buildEmbed({
        title: "🎫 SUPORTE",
        description: "Clique no botão abaixo para abrir um ticket.",
        color: "#c6a95f"
    });
    const ticketRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_open")
            .setLabel("Abrir ticket")
            .setStyle(ButtonStyle.Primary)
    );
    await sendContainerEmbed(guild, "ticket", ticketEmbed, [ticketRow]);
}

async function sendContainerEmbed(guild, channelName, embed, components = []) {
    const channel = guild.channels.cache.find(
        (ch) => ch.isTextBased() && normalizeName(ch.name) === normalizeName(channelName)
    );
    if (!channel || !channel.isTextBased()) return;
    const messages = await channel.messages.fetch({ limit: 20 });
    const botMessages = messages.filter((msg) => msg.author.id === guild.client.user.id);
    for (const message of botMessages.values()) {
        await message.delete().catch(() => {});
    }
    const sent = await channel.send({ embeds: [embed], components });
    await sent.pin().catch(() => {});
}

export function getNextRoleName(currentRoleName) {
    const idx = ROLE_ORDER.findIndex((name) => name === currentRoleName);
    if (idx <= 0) return null;
    return ROLE_ORDER[idx - 1];
}
