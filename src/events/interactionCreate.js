import { handleEventAnnouncementInteraction } from "../handlers/eventAnnouncementHandler.js";
import { buildEmbed } from "../utils/embed.js";
import { SERVER_CONFIG } from "../utils/config.js";
import { runReset } from "../commands/admin/admin-reset-estrutura.js";
import { registerParticipant } from "../services/core/eventService.js";
import { prisma } from "../services/prisma.js";
import { getProgressForTier } from "../services/core/promotionService.js";
import { ChannelType } from "discord.js";

export const name = "interactionCreate";

export async function execute(interaction, client) {
    // Handler para slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Comando ${interaction.commandName} não encontrado.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Erro ao executar comando ${interaction.commandName}:`, error);
            const errorMessage = { content: '❌ Houve um erro ao executar este comando!', ephemeral: true };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
        return;
    }

    const eventHandled = await handleEventAnnouncementInteraction(interaction);
    if (eventHandled) return;

    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("evento_participar:")) {
        const [, eventId] = interaction.customId.split(":");
        try {
            await registerParticipant(interaction.guild.id, eventId, interaction.user.id);
            await interaction.reply({ content: "✅ Participação confirmada!", ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
        }
        return;
    }

    if (interaction.customId === "metas_progress") {
        const user = await prisma.user.findUnique({
            where: {
                guildId_discordId: {
                    guildId: interaction.guild.id,
                    discordId: interaction.user.id
                }
            }
        });
        if (!user) {
            return interaction.reply({ content: "❌ Usuário não encontrado.", ephemeral: true });
        }
        const progress = getProgressForTier(user);
        return interaction.reply({
            content:
                `**Nível atual:** ${user.nivel}\n` +
                `**Próximo nível:** ${progress.nextTier || "Manual"}\n\n` +
                `Mensagens: ${progress.current.mensagens}/${progress.requirements?.mensagens ?? "-"}\n` +
                `Eventos: ${progress.current.eventos}/${progress.requirements?.eventos ?? "-"}\n` +
                `Recrutas: ${progress.current.recrutas}/${progress.requirements?.recrutas ?? "-"}\n` +
                `Guerras: ${progress.current.guerras}/${progress.requirements?.war ?? "-"}`,
            ephemeral: true
        });
    }

    if (interaction.customId === "ticket_open") {
        const category = interaction.guild.channels.cache.find(
            (ch) => ch.type === ChannelType.GuildCategory && ch.name.includes("SUPORTE")
        );
        const adminRoles = [
            "Administração ALTA",
            "Administração TESTE",
            "Dom pai da ALTA",
            "♰ 𝚂𝚊𝚗𝚝𝚝𝚘𝚜",
            "taki",
            "𝑺𝒂𝒊𝒏𝒕",
            "bielzinho.imt",
            "!Silva safadin off",
            "mSeven"
        ];
        const adminRoleIds = interaction.guild.roles.cache
            .filter((role) => adminRoles.includes(role.name))
            .map((role) => role.id);

        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`.toLowerCase(),
            type: ChannelType.GuildText,
            parent: category?.id,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: ["ViewChannel"] },
                { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
                ...adminRoleIds.map((id) => ({
                    id,
                    allow: ["ViewChannel", "SendMessages", "ManageChannels"]
                }))
            ]
        });

        const logChannel = interaction.guild.channels.cache.find(
            (ch) => ch.type === ChannelType.GuildText && ch.name === "ticket-log"
        );
        if (logChannel?.isTextBased()) {
            await logChannel.send(`🎫 Ticket criado por ${interaction.user.tag}: ${channel}`);
        }

        return interaction.reply({
            content: `✅ Ticket criado: ${channel}`,
            ephemeral: true
        });
    }

    if (interaction.customId.startsWith("admin_reset_")) {
        const [action, userId] = interaction.customId.split(":");
        if (interaction.user.id !== userId) {
            return interaction.reply({ content: "❌ Apenas o autor pode confirmar.", ephemeral: true });
        }
        if (action === "admin_reset_confirm") {
            return runReset(interaction);
        }
        if (action === "admin_reset_cancel") {
            return interaction.reply({ content: "❎ Reset cancelado.", ephemeral: true });
        }
    }

    // Sistema de tags - delegar para TagSystem
    if (client.tagSystem) {
        const handled = await client.tagSystem.handleTagButton(interaction);
        if (handled) return;
    }
    
    // Sistema de verificação de gênero (código antigo mantido para compatibilidade)
    if (interaction.customId.startsWith('gender_')) {
        const [, gender, userId] = interaction.customId.split('_');
        
        // Verificar se é o usuário correto
        if (interaction.user.id !== userId) {
            return interaction.reply({
                content: '❌ Você não pode usar este botão.',
                ephemeral: true
            });
        }
        
        try {
            const member = interaction.member;
            const guild = interaction.guild;
            
            // Verificar se já tem o cargo feminino (caso seja mulher)
            if (gender === 'female') {
                const femaleRole = guild.roles.cache.get(SERVER_CONFIG.ROLES.FEMALE);
                if (femaleRole && !member.roles.cache.has(femaleRole.id)) {
                    await member.roles.add(femaleRole, 'Escolha de gênero - Feminino');
                }
            }
            
            // Criar embed de confirmação
            const confirmEmbed = buildEmbed({
                title: '✅ Verificação Concluída!',
                description:
                    `Gênero definido como: **${gender === 'male' ? 'Masculino' : 'Feminino'}**\n` +
                    'Agora você pode acessar todos os canais do servidor!',
                fields: [
                    { name: '👤 Usuário', value: `${interaction.user.tag}`, inline: true },
                    { name: '🏷️ Status', value: 'Verificação concluída', inline: true }
                ],
                thumbnail: interaction.user.displayAvatarURL({ dynamic: true })
            });
            
            await interaction.reply({
                embeds: [confirmEmbed],
                ephemeral: true
            });
            
            // Deletar a mensagem original após 5 segundos
            setTimeout(async () => {
                try {
                    await interaction.message.delete();
                } catch (error) {
                    console.log('Não foi possível deletar a mensagem de verificação');
                }
            }, 5000);
            
            console.log(`✅ ${interaction.user.tag} escolheu gênero: ${gender}`);
            
        } catch (error) {
            console.error('Erro ao processar escolha de gênero:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao processar sua escolha. Tente novamente.',
                ephemeral: true
            });
        }
    }
    
    // Sistema de recrutamento
    if (interaction.customId.startsWith('recruitment_')) {
        const [, action, recruitmentId] = interaction.customId.split('_');
        
        // Verificar se é staff
        const hasStaffRole = interaction.member.roles.cache.some(role => 
            SERVER_CONFIG.STAFF_ROLES.includes(role.id)
        );
        
        if (!hasStaffRole) {
            return interaction.reply({
                content: '❌ Apenas membros da staff podem aprovar/recusar recrutamentos.',
                ephemeral: true
            });
        }
        
        // Processar aprovação/recusa do recrutamento
        try {
            await handleRecruitmentAction(interaction, action, recruitmentId);
        } catch (error) {
            console.error('Erro ao processar recrutamento:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao processar o recrutamento.',
                ephemeral: true
            });
        }
    }
}

async function handleRecruitmentAction(interaction, action, recruitmentId) {
    // Esta função será implementada junto com o sistema de recrutamento
    // Por enquanto, apenas responde
    await interaction.reply({
        content: `Sistema de recrutamento em desenvolvimento. Ação: ${action}, ID: ${recruitmentId}`,
        ephemeral: true
    });
}

