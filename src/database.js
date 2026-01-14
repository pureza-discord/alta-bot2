import sqlite3 from "sqlite3";
import fs from "fs";

export let db;

export function loadDatabase() {
    if (!fs.existsSync("database.db")) {
        fs.writeFileSync("database.db", "");
    }

    db = new sqlite3.Database("database.db", (err) => {
        if (err) {
            console.error("Erro ao conectar ao database:", err);
            return;
        }
        console.log("✅ Database conectado com sucesso!");
    });

    // Executar SQL - cada comando separadamente
    const sql = fs.readFileSync("./src/database.sql", "utf8");
    const statements = sql.split(";").filter(s => s.trim().length > 0);
    
    let completed = 0;
    statements.forEach((statement, index) => {
        db.run(statement.trim() + ";", (err) => {
            if (err) {
                console.error(`Erro ao executar statement ${index + 1}:`, err);
            } else {
                completed++;
                if (completed === statements.length) {
                    console.log("✅ Tabelas criadas com sucesso!");
                }
            }
        });
    });
}

