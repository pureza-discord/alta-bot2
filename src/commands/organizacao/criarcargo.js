import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Cargos**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Uso: `.criarcargo <nome> [cor]`\nExemplo: `.criarcargo Moderador #FFD700`" });
    }

    const corIndex = args.findIndex(arg => arg.startsWith("#"));
    let nome, corHex = "#FFD700";

    if (corIndex !== -1) {
        nome = args.slice(0, corIndex).join(" ");
        corHex = args[corIndex];
    } else {
        nome = args.join(" ");
    }

    // Validar e converter cor
    let cor;
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(corHex)) {
        cor = parseInt(corHex.replace("#", ""), 16);
    } else {
        cor = 0xFFD700; // Dourado padrão
    }

    try {
        const cargo = await message.guild.roles.create({
            name: nome,
            color: cor,
            reason: `Criado por ${message.author.tag}`
        });

        const embed = buildEmbed({
            title: "🎭 Cargo Criado",
            description: `O cargo ${cargo} foi criado com sucesso.`,
            fields: [
                { name: "📝 Nome", value: cargo.name, inline: true },
                { name: "🎨 Cor", value: corHex, inline: true }
            ],
            color: cargo.color || undefined
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao criar cargo:", error);
        message.reply({ content: "❌ Erro ao criar cargo. Verifique minhas permissões." }).catch(() => {});
    }
}

