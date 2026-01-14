import { EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!args[0]) {
        return message.reply({ content: "❌ Uso: `.impulso <data>`\nExemplo: `.impulso 20/11/2025`" });
    }

    const dataInput = args[0];
    
    // Validar formato da data (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dataInput.match(dateRegex);
    
    if (!match) {
        return message.reply({ 
            content: "❌ Formato de data inválido! Use o formato **DD/MM/YYYY** (ex: 20/11/2025)"
        });
    }

    const [, dia, mes, ano] = match;
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    // Validar valores da data
    if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 2020 || anoNum > 2100) {
        return message.reply({ 
            content: "❌ Data inválida! Verifique os valores (dia: 1-31, mês: 1-12, ano: 2020-2100)"
        });
    }

    // Criar objeto Date (mês é 0-indexed no JavaScript)
    const dataBusca = new Date(anoNum, mesNum - 1, diaNum);
    const dataInicio = new Date(dataBusca.getFullYear(), dataBusca.getMonth(), dataBusca.getDate());
    const dataFim = new Date(dataBusca.getFullYear(), dataBusca.getMonth(), dataBusca.getDate() + 1);

    try {
        // Buscar todos os membros do servidor
        const members = await message.guild.members.fetch();
        
        // Filtrar membros que impulsionaram na data especificada
        const impulsionadores = members.filter(member => {
            if (!member.premiumSince) return false;
            
            const dataImpulso = new Date(member.premiumSince);
            return dataImpulso >= dataInicio && dataImpulso < dataFim;
        });

        if (impulsionadores.size === 0) {
            const embed = new EmbedBuilder()
                .setTitle("🚀 Impulsionadores do Servidor")
                .setDescription(`Nenhum membro impulsionou o servidor em **${dataInput}**`)
                .setColor("#2b2d31")
                .setFooter({ text: `Solicitado por ${message.author.tag}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Ordenar por data de impulso
        const sorted = Array.from(impulsionadores.values())
            .sort((a, b) => new Date(a.premiumSince) - new Date(b.premiumSince));

        // Criar lista de impulsionadores
        let lista = "";
        let count = 0;
        
        for (const member of sorted) {
            count++;
            const dataImpulso = new Date(member.premiumSince);
            const horaFormatada = dataImpulso.toLocaleTimeString("pt-BR", { 
                hour: "2-digit", 
                minute: "2-digit" 
            });
            
            lista += `${count}. ${member.user.tag} - ${horaFormatada}\n`;
            
            // Limitar a 20 membros para não exceder o limite do embed
            if (count >= 20) {
                lista += `\n... e mais ${sorted.length - 20} membro(s)`;
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`🚀 Impulsionadores do Servidor - ${dataInput}`)
            .setDescription(`**${impulsionadores.size}** membro(s) impulsionaram o servidor nesta data:`)
            .setColor("#ff73fa")
            .addFields(
                { name: "📋 Lista de Impulsionadores", value: lista || "Nenhum", inline: false }
            )
            .setFooter({ text: `Solicitado por ${message.author.tag}` })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao buscar impulsionadores:", error);
        message.reply({ 
            content: "❌ Erro ao buscar impulsionadores. Verifique se tenho permissão para ver membros do servidor." 
        }).catch(() => {});
    }
}


