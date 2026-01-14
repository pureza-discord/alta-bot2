import { 
    PermissionsBitField, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} from 'discord.js';
import { SERVER_CONFIG } from '../../utils/config.js';

export async function execute(message, args, client) {
    // Verificar permissões
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply({ 
            content: '❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.',
            ephemeral: true 
        });
    }
    
    // Verificar se é staff
    const hasStaffRole = message.member.roles.cache.some(role => 
        SERVER_CONFIG.STAFF_ROLES.includes(role.id)
    );
    
    if (!hasStaffRole) {
        return message.reply({ 
            content: '❌ Apenas membros da staff podem configurar recrutamentos.',
            ephemeral: true 
        });
    }
    
    try {
        // Criar modal para ficha de recrutamento
        const modal = new ModalBuilder()
            .setCustomId(`recruitment_modal_${message.author.id}`)
            .setTitle('📋 Ficha de Recrutamento');
        
        // Campo para o recrutado
        const recruitedInput = new TextInputBuilder()
            .setCustomId('recruited_name')
            .setLabel('Nome do Recrutado')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: @Niko ou Niko')
            .setRequired(true)
            .setMaxLength(100);
        
        // Campo para cargo/permissão
        const cargoInput = new TextInputBuilder()
            .setCustomId('cargo_perm')
            .setLabel('Cargo/Permissão')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Relíquia / cargo 1 estrela')
            .setRequired(true)
            .setMaxLength(200);
        
        // Campo para gênero
        const genderInput = new TextInputBuilder()
            .setCustomId('gender')
            .setLabel('Gênero')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Masculino ou Feminino')
            .setRequired(true)
            .setMaxLength(20);
        
        // Campo para total
        const totalInput = new TextInputBuilder()
            .setCustomId('total')
            .setLabel('Total')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 1')
            .setRequired(true)
            .setMaxLength(5);
        
        // Campo para menções adicionais
        const mentionsInput = new TextInputBuilder()
            .setCustomId('mentions')
            .setLabel('Menções Adicionais (opcional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: @Saint @taki')
            .setRequired(false)
            .setMaxLength(200);
        
        // Adicionar campos ao modal
        modal.addComponents(
            new ActionRowBuilder().addComponents(recruitedInput),
            new ActionRowBuilder().addComponents(cargoInput),
            new ActionRowBuilder().addComponents(genderInput),
            new ActionRowBuilder().addComponents(totalInput),
            new ActionRowBuilder().addComponents(mentionsInput)
        );
        
        // Como não podemos mostrar modal em mensagem normal, vamos criar um embed explicativo
        const embed = new EmbedBuilder()
            .setTitle('📋 Sistema de Recrutamento')
            .setDescription('Para configurar um recrutamento, use o comando em um canal onde o bot possa responder com um formulário interativo.')
            .setColor('#2b2d31')
            .addFields(
                { name: '📝 Formato da Ficha', value: '```Recrutador : @Gustavo\nRecrutado: @Niko\nCargo/perm: Relíquia / cargo 1 estrela\nGênero : Masculino\nTotal : 1\n@Saint @taki```' },
                { name: '📍 Canal de Fichas', value: `<#${SERVER_CONFIG.RECRUITMENT_CHANNEL}>` },
                { name: '✅ Como usar', value: 'Use este comando em um canal de texto normal para abrir o formulário.' }
            )
            .setFooter({ text: 'Sistema de recrutamento automático' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Erro no comando setrecrutamento:', error);
        await message.reply({ 
            content: '❌ Ocorreu um erro ao configurar o recrutamento.',
            ephemeral: true 
        });
    }
}
