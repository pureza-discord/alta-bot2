export const name = 'messageReactionAdd';

export async function execute(reaction, user, client) {
    // Se a reação for parcial, buscar a mensagem completa
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Erro ao buscar reação:', error);
            return;
        }
    }
    
    // Sistema de aprovação de tags via reação
    if (client.tagSystem) {
        await client.tagSystem.handleApprovalReaction(reaction, user);
    }
}
