import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class TagSystem {
    constructor(client) {
        this.client = client;
        this.CHANNEL_ID = '1460434836895436894';
        this.LOG_USER_ID = '367813556554563594'; // ID principal (compatibilidade)
        this.LOG_USER_IDS = ['367813556554563594', '1401902057929183232']; // IDs que recebem DM
        
        this.ROLES = {
            MALE: '1419309871656075397',
            FEMALE: '1457210009606688893',
            NOT_VERIFIED: '1457231923830067325'
        };
    }

    /**
     * Cria o embed fixo do sistema de tags
     */
    createTagEmbed() {
        return new EmbedBuilder()
            .setTitle('🏷️ **Sistema de Tags – Alta Cúpula**')
            .setDescription(
                '**Escolha seu gênero para receber a tag correspondente.**\n\n' +
                '🔹 Clique em **HOMEM** ou **MULHER**\n' +
                '🔹 O cargo será atribuído automaticamente\n' +
                '🔹 Processo rápido e direto'
            )
            .setColor('#000000')
            .addFields(
                {
                    name: '👨 **Masculino**',
                    value: 'Receba a tag **Capanga**',
                    inline: true
                },
                {
                    name: '👩 **Feminino**',
                    value: 'Receba a tag **Dolls**',
                    inline: true
                }
            )
            .setFooter({ 
                text: 'Alta Cúpula • Sistema Automático de Tags',
                iconURL: this.client.user?.displayAvatarURL()
            })
            .setTimestamp();
    }

    /**
     * Cria os botões do sistema
     */
    createTagButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('tag_male')
                    .setLabel('👨 HOMEM')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('tag_female')
                    .setLabel('👩 MULHER')
                    .setStyle(ButtonStyle.Danger)
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
            const messages = await channel.messages.fetch({ limit: 10 });
            const botMessages = messages.filter(msg => msg.author.id === this.client.user.id);

            // Se não há mensagem do bot, criar nova
            if (botMessages.size === 0) {
                await this.createTagMessage(channel);
                console.log('✅ Embed de tags criado no canal');
            } else {
                console.log('✅ Embed de tags já existe no canal');
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de tags:', error);
        }
    }

    /**
     * Cria a mensagem com embed e botões
     */
    async createTagMessage(channel) {
        const embed = this.createTagEmbed();
        const buttons = this.createTagButtons();

        return await channel.send({
            embeds: [embed],
            components: [buttons]
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
        const logEmbed = new EmbedBuilder()
            .setTitle('📌 **SOLICITAÇÃO DE TAG**')
            .setDescription('**O usuário solicitou atribuição de tag de gênero.**')
            .addFields(
                {
                    name: '👤 **Usuário**',
                    value: `${user.tag} (${user})`,
                    inline: false
                },
                {
                    name: '🆔 **ID do Usuário**',
                    value: `\`${user.id}\``,
                    inline: true
                },
                {
                    name: '🚻 **Gênero Escolhido**',
                    value: genderType === 'male' ? 'Homem (Capanga)' : 'Mulher (Dolls)',
                    inline: true
                },
                {
                    name: '📅 **Data**',
                    value: now.toLocaleDateString('pt-BR'),
                    inline: true
                },
                {
                    name: '⏰ **Hora**',
                    value: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    inline: true
                },
                {
                    name: '✅ **Para Aprovar**',
                    value: 'Reaja com ✅ nesta mensagem para confirmar\nque a tag foi aprovada manualmente no servidor da Pureza.',
                    inline: false
                }
            )
            .setColor('#2f3136') // Cor escura/profissional
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
            .setFooter({ 
                text: 'Sistema de Tags • Alta Cúpula',
                iconURL: this.client.user?.displayAvatarURL()
            })
            .setTimestamp();

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
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ **APROVAÇÃO CONFIRMADA**')
                .setDescription('**A tag foi aprovada manualmente no servidor da Pureza.**')
                .addFields(
                    {
                        name: '👤 **Usuário Aprovado**',
                        value: approvalData.userTag,
                        inline: true
                    },
                    {
                        name: '🏷️ **Tag**',
                        value: approvalData.roleName,
                        inline: true
                    },
                    {
                        name: '✅ **Aprovado por**',
                        value: user.tag,
                        inline: true
                    },
                    {
                        name: '📋 **Status**',
                        value: 'Tag aprovada manualmente no servidor da Pureza',
                        inline: false
                    }
                )
                .setColor('#00FF00')
                .setFooter({ 
                    text: 'Sistema de Aprovação • Alta Cúpula',
                    iconURL: this.client.user?.displayAvatarURL()
                })
                .setTimestamp();

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
        const channel = this.client.channels.cache.get(this.CHANNEL_ID);
        if (channel) {
            setTimeout(async () => {
                await this.createTagMessage(channel);
                console.log('🔄 Embed de tags recriado após deleção');
            }, 2000);
        }
    }
}
