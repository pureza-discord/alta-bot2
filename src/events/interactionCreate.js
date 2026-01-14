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

    if (!interaction.isButton()) return;

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
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Verificação Concluída!')
                .setDescription(`Gênero definido como: **${gender === 'male' ? 'Masculino' : 'Feminino'}**\n\nAgora você pode acessar todos os canais do servidor!`)
                .setColor('#00ff00')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Bem-vindo(a) à Alta Cúpula!' })
                .setTimestamp();
            
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

