import { SERVER_CONFIG } from '../utils/config.js';

export const name = 'guildMemberAdd';

export async function execute(member, client) {
    try {
        // Adicionar cargo "Não Verificado" automaticamente para novos membros
        const naoVerificadoRole = member.guild.roles.cache.get(SERVER_CONFIG.ROLES.NAO_VERIFICADO);
        if (naoVerificadoRole) {
            await member.roles.add(naoVerificadoRole, 'Cargo automático - Não Verificado');
            console.log(`✅ Cargo "Não Verificado" adicionado para ${member.user.tag}`);
        } else {
            console.error('❌ Cargo "Não Verificado" não encontrado');
        }
        
    } catch (error) {
        console.error('Erro no evento guildMemberAdd:', error);
    }
}
