export const name = 'messageDelete';

export async function execute(message, client) {
    // Sistema de tags - recriar embed se deletado
    if (client.tagSystem) {
        await client.tagSystem.handleMessageDelete(message);
    }
}
