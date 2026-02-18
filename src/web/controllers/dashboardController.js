import { User } from "../../models/User.js";
import { District } from "../../models/District.js";
import { config } from "../../config/index.js";

export async function dashboardController(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Não autenticado." });
    }
    const user = await User.findOne({ userId, guildId: config.guildId });
    if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const district = user.districtId ? await District.findById(user.districtId) : null;
    return res.json({
        xp: user.xpTotal,
        level: user.level,
        district: district?.name || null,
        influence: user.influence,
        medals: user.medals,
        money: user.money,
        ranking: {
            xp: user.xpTotal,
            influence: user.influence
        }
    });
}
