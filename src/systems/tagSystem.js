import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import path from 'path';
import { buildEmbed } from '../utils/embed.js';

export class TagSystem {
    constructor(client) {
        this.client = client;
        this.CHANNEL_ID = '1460434836895436894';
        this.LOG_USER_ID = '1468495146122481754'; // ID principal (compatibilidade)
        this.LOG_USER_IDS = ['1468495146122481754']; // IDs que recebem DM
        
        this.ROLES = {
            MALE: '1419309871656075397',
            FEMALE: '1457210009606688893',
            NOT_VERIFIED: '1457231923830067325'
        };
    }

    /**
     * Cria o container oficial do sistema de tags
     */
    createTagEmbed(guild) {
        const tagEmoji = this.formatEmoji(
            this.getEmojiById(guild, '1419375921609179228'),
            '<:mfia:1419375921609179228>'
        );
        const maleTextEmoji = this.formatEmoji(this.getEmojiByName(guild, 'chanceler'), ':chanceler:');
        const femaleTextEmoji = this.formatEmoji(this.getEmojiByName(guild, 'meangirls'), ':meangirls:');

        return buildEmbed({
            title: `${tagEmoji} Sistema de Tags • Alta Cúpula`,
            description:
                '**Interface oficial de identificação.**\n' +
                'Selecione o gênero para receber a tag correspondente.\n' +
                'Esta escolha é **definitiva** e não pode ser alterada.',
            fields: [
                {
                    name: `${maleTextEmoji} Masculino`,
                    value: `Recebe a tag <@&${this.ROLES.MALE}>`,
                    inline: false
                },
                {
                    name: `${femaleTextEmoji} Feminino`,
                    value: `Recebe a tag <@&${this.ROLES.FEMALE}>`,
                    inline: false
                }
            ],
            color: '#0b0d12',
            footerText: 'Alta Cúpula • Sistema Oficial de Tags',
            thumbnail: 'attachment://alta_famosos.png',
            image: 'attachment://alta_famosos.png'
        });
    }

    /**
     * Cria os botões do sistema
     */
    createTagButtons(guild) {
        const maleEmoji = this.getEmojiByName(guild, 'greensmokee');
        const femaleEmoji = this.getEmojiByName(guild, 'pinkweed');

        if (!maleEmoji || !femaleEmoji) {
            console.warn('⚠️ Emojis personalizados não encontrados no servidor (greensmokee/pinkweed).');
        }

        const maleButton = new ButtonBuilder()
            .setCustomId('tag_male')
            .setLabel('HOMEM')
            .setStyle(ButtonStyle.Secondary);

        const femaleButton = new ButtonBuilder()
            .setCustomId('tag_female')
            .setLabel('MULHER')
            .setStyle(ButtonStyle.Secondary);

        if (maleEmoji) {
            maleButton.setEmoji({ id: maleEmoji.id, name: maleEmoji.name });
        }

        if (femaleEmoji) {
            femaleButton.setEmoji({ id: femaleEmoji.id, name: femaleEmoji.name });
        }

        return new ActionRowBuilder()
            .addComponents(
                maleButton,
                femaleButton
            );
    }

    /**
     * Inicializa o sistema - garante que o embed existe no canal
     */
    async initialize() {
        try {
            const channel = this.client.channels.cache.get(this.CHANNEL_ID);
            if (!channel) {
                console.error(`❌ Canal ${this.CHANNEL_ID} não encontrado`);
                return;
            }

            // Buscar mensagens existentes no canal
            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessages = messages.filter(msg => msg.author.id === this.client.user.id);
            let containerMessage = null;

            // Se não há mensagem do bot, criar nova
            if (botMessages.size === 0) {
                containerMessage = await this.createTagMessage(channel);
                console.log('✅ Container de tags criado no canal');
            } else {
                // Manter apenas uma mensagem do bot (a mais recente) e atualizar o conteúdo
                const [latestMessage] = [...botMessages.values()]
                    .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

                await this.updateTagMessage(latestMessage, channel);
                containerMessage = latestMessage;
            }

            // Remover qualquer outra mensagem do canal (painel único)
            const messagesToDelete = messages.filter(msg => msg.id !== containerMessage.id);
            for (const message of messagesToDelete.values()) {
                if (message.deletable) {
                    await message.delete().catch(() => {});
                }
            }

            console.log('✅ Container de tags verificado e atualizado');

        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de tags:', error);
        }
    }

    /**
     * Cria a mensagem com embed e botões
     */
    async createTagMessage(channel) {
        const embed = this.createTagEmbed(channel.guild);
        const buttons = this.createTagButtons(channel.guild);
        const files = this.getEmbedAssets();

        return await channel.send({
            embeds: [embed],
            components: [buttons],
            files
        });
    }

    /**
     * Atualiza a mensagem existente com o container oficial
     */
    async updateTagMessage(message, channel) {
        const embed = this.createTagEmbed(channel.guild);
        const buttons = this.createTagButtons(channel.guild);
        const files = this.getEmbedAssets();

        await message.edit({
            embeds: [embed],
            components: [buttons],
            files
        });
    }

    /**
     * Processa clique nos botões de tag
     */
    async handleTagButton(interaction) {
        if (!interaction.customId.startsWith('tag_')) return false;

        const genderType = interaction.customId === 'tag_male' ? 'male' : 'female';
        const member = interaction.member;
        const guild = interaction.guild;

        try {
            // ⚠️ REGRA ABSOLUTA: Verificar se já escolheu um gênero (QUALQUER UM)
            const maleRole = guild.roles.cache.get(this.ROLES.MALE);
            const femaleRole = guild.roles.cache.get(this.ROLES.FEMALE);
            
            const hasAnyGenderRole = 
                (maleRole && member.roles.cache.has(maleRole.id)) ||
                (femaleRole && member.roles.cache.has(femaleRole.id));

            // Se já possui qualquer cargo de gênero, BLOQUEAR completamente
            if (hasAnyGenderRole) {
                return await interaction.reply({
                    content: '❌ **Você já escolheu um gênero. Essa ação não pode ser alterada.**',
                    ephemeral: true
                });
            }

            // Determinar cargo a ser adicionado
            const roleToAdd = guild.roles.cache.get(
                genderType === 'male' ? this.ROLES.MALE : this.ROLES.FEMALE
            );
            const notVerifiedRole = guild.roles.cache.get(this.ROLES.NOT_VERIFIED);

            if (!roleToAdd) {
                return await interaction.reply({
                    content: '❌ Cargo não encontrado no servidor.',
                    ephemeral: true
                });
            }

            // Adicionar cargo de gênero
            await member.roles.add(roleToAdd, 'Sistema de Tags - Seleção automática');

            // Remover cargo "Não Verificado" se existir
            if (notVerifiedRole && member.roles.cache.has(notVerifiedRole.id)) {
                await member.roles.remove(notVerifiedRole, 'Sistema de Tags - Cargo removido automaticamente');
            }

            // Resposta ao usuário
            await interaction.reply({
                content: `✅ **Tag atribuída com sucesso!**\nVocê recebeu a tag **${roleToAdd.name}**.`,
                ephemeral: true
            });

            // Enviar log via DM
            await this.sendLogDM(interaction.user, genderType, roleToAdd.name);

            console.log(`✅ Tag ${roleToAdd.name} atribuída para ${member.user.tag}`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao processar tag:', error);
            await interaction.reply({
                content: '❌ Erro ao processar sua solicitação. Tente novamente.',
                ephemeral: true
            });
            return true;
        }
    }

    /**
     * Envia log via DM para todos os usuários específicos (EXCLUSIVAMENTE EM EMBED)
     */
    async sendLogDM(user, genderType, roleName) {
        const now = new Date();
        
        // Criar embed profissional conforme especificação
        const logEmbed = buildEmbed({
            title: '📌 Solicitação de Tag',
            description: 'O usuário solicitou atribuição de tag de gênero.',
            fields: [
                {
                    name: '👤 Usuário',
                    value: `${user.tag} (${user})`,
                    inline: false
                },
                {
                    name: '🆔 ID do Usuário',
                    value: `\`${user.id}\``,
                    inline: true
                },
                {
                    name: '🚻 Gênero Escolhido',
                    value: genderType === 'male' ? 'Homem (Capanga)' : 'Mulher (Dolls)',
                    inline: true
                },
                {
                    name: '📅 Data',
                    value: now.toLocaleDateString('pt-BR'),
                    inline: true
                },
                {
                    name: '⏰ Hora',
                    value: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    inline: true
                },
                {
                    name: '✅ Para Aprovar',
                    value: 'Reaja com ✅ nesta mensagem para confirmar\nque a tag foi aprovada manualmente no servidor da Pureza.',
                    inline: false
                }
            ],
            color: '#2f3136',
            thumbnail: user.displayAvatarURL({ dynamic: true, size: 128 }),
            footerText: 'Sistema de Tags • Alta Cúpula',
            footerIcon: this.client.user?.displayAvatarURL()
        });

        // Enviar para todos os IDs configurados
        for (const logUserId of this.LOG_USER_IDS) {
            try {
                const logUser = await this.client.users.fetch(logUserId);
                
                // Enviar APENAS o embed (sem content)
                const dmMessage = await logUser.send({ embeds: [logEmbed] });
                
                // Adicionar reação automática ✅
                await dmMessage.react('✅');

                // Armazenar referência para monitoramento de reações
                this.client.tagApprovals = this.client.tagApprovals || new Map();
                this.client.tagApprovals.set(dmMessage.id, {
                    userId: user.id,
                    userTag: user.tag,
                    gender: genderType,
                    roleName: roleName,
                    timestamp: now.toISOString()
                });

                console.log(`📨 Embed de log enviado via DM para ${logUser.tag}`);

            } catch (error) {
                console.error(`❌ Erro ao enviar log via DM para ID ${logUserId}:`, error);
            }
        }
    }

    /**
     * Processa aprovação via reação na DM
     */
    async handleApprovalReaction(reaction, user) {
        // Verificar se é um dos usuários autorizados reagindo com ✅
        if (!this.LOG_USER_IDS.includes(user.id) || reaction.emoji.name !== '✅') {
            return false;
        }

        const messageId = reaction.message.id;
        
        if (!this.client.tagApprovals?.has(messageId)) {
            return false;
        }

        try {
            const approvalData = this.client.tagApprovals.get(messageId);
            
            // Criar embed de confirmação profissional
            const confirmEmbed = buildEmbed({
                title: '✅ Aprovação Confirmada',
                description: 'A tag foi aprovada manualmente no servidor da Pureza.',
                fields: [
                    {
                        name: '👤 Usuário Aprovado',
                        value: approvalData.userTag,
                        inline: true
                    },
                    {
                        name: '🏷️ Tag',
                        value: approvalData.roleName,
                        inline: true
                    },
                    {
                        name: '✅ Aprovado por',
                        value: user.tag,
                        inline: true
                    },
                    {
                        name: '📋 Status',
                        value: 'Tag aprovada manualmente no servidor da Pureza',
                        inline: false
                    }
                ],
                color: '#0f0f0f',
                footerText: 'Sistema de Aprovação • Alta Cúpula',
                footerIcon: this.client.user?.displayAvatarURL()
            });

            // Enviar APENAS o embed de confirmação (sem content)
            await reaction.message.reply({ embeds: [confirmEmbed] });

            // Remover da lista de pendências
            this.client.tagApprovals.delete(messageId);

            console.log(`✅ Aprovação confirmada para ${approvalData.userTag} por ${user.tag}`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao processar aprovação:', error);
            return false;
        }
    }

    /**
     * Recriar embed se for deletado
     */
    async handleMessageDelete(message) {
        if (message.channelId !== this.CHANNEL_ID) return;
        if (message.author?.id !== this.client.user.id) return;

        // Se a mensagem deletada era do bot no canal de tags, recriar
        setTimeout(async () => {
            await this.initialize();
            console.log('🔄 Container de tags recriado após deleção');
        }, 2000);
    }

    /**
     * Busca emoji pelo nome no servidor
     */
    getEmojiByName(guild, name) {
        return guild?.emojis?.cache?.find(emoji => emoji.name === name) || null;
    }

    /**
     * Busca emoji pelo id no servidor
     */
    getEmojiById(guild, id) {
        return guild?.emojis?.cache?.get(id) || null;
    }

    /**
     * Formata emoji com fallback em texto
     */
    formatEmoji(emoji, fallback) {
        return emoji ? `<:${emoji.name}:${emoji.id}>` : fallback;
    }

    /**
     * Anexos usados no container
     */
    getEmbedAssets() {
        const bannerPath = path.resolve(process.cwd(), 'assets', 'alta_famosos.png');

        return [
            new AttachmentBuilder(bannerPath, { name: 'alta_famosos.png' })
        ];
    }
}
