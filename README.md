# 🚀 Alta Bot v2.0 - Sistema Profissional

Bot profissional da Alta Cúpula com sistemas avançados de segurança, moderação e automação desenvolvido em Discord.js v14.

## ✨ Principais Recursos

### 🛡️ Sistemas de Segurança
- **AutoMod Avançado**: Detecta e pune automaticamente spam, flood, links suspeitos e palavras proibidas
- **Anti-Raid Inteligente**: Protege contra ataques coordenados com detecção automática de ações suspeitas
- **Sistema de Verificação**: Escolha automática de gênero ao entrar no servidor
- **Backup & Restore**: Sistema completo de backup para proteção contra nukes

### 🤖 Automação Inteligente
- **Recrutamento Automático**: Sistema de fichas com aprovação/recusa automática
- **Logs Centralizados**: Registro completo de todas as ações de moderação
- **Hierarquia de Cargos**: Verificação automática de permissões e hierarquia
- **Notificações DM**: Avisos automáticos para usuários punidos

### 📊 Recursos Profissionais
- **Comandos Otimizados**: Interface moderna com embeds profissionais
- **Sistema de Configuração**: Configurações flexíveis por servidor
- **Tratamento de Erros**: Sistema robusto de tratamento de erros
- **Performance**: Otimizado para alta performance e baixo uso de recursos

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18.0.0 ou superior
- NPM ou Yarn
- Token do bot Discord

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd alta-bot2

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env com:
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui

# Execute o bot
npm start
```

## 📋 Comandos Disponíveis

### 🧰 Utilidade
- `.ajuda` - Central de ajuda completa
- `.sobre` - Informações do bot
- `.userinfo` - Informações de usuário
- `.serverinfo` - Informações do servidor
- `.names` - Histórico de nomes
- `.userlog` - Logs de usuário
- `.online` - Membros online
- `.impulso` - Informações de impulso

### 🛡️ Moderação
- `.ban <@user> [motivo]` - Banir membro
- `.kick <@user> [motivo]` - Expulsar membro
- `.timeout <@user> <duração> [motivo]` - Silenciar temporariamente
- `.untimeout <@user>` - Remover silenciamento
- `.clear <quantidade>` - Limpar mensagens
- `.lock` - Bloquear canal
- `.unlock` - Desbloquear canal
- `.addrole <@user> <@role>` - Adicionar cargo
- `.removerole <@user> <@role>` - Remover cargo
- `.mutecall <@user>` - Mutar em call
- `.unmutecall <@user>` - Desmutar em call

### 🏛️ Organização
- `.criarcategoria <nome>` - Criar categoria
- `.criartexto <nome>` - Criar canal de texto
- `.criarvoz <nome>` - Criar canal de voz
- `.criarcargo <nome> [cor]` - Criar cargo
- `.excluircargo <@role>` - Excluir cargo
- `.aceitar` - Aceitar recrutamento
- `.recrutamento` - Ver recrutamentos
- `.setrecrutamento` - Configurar recrutamento

### 💾 Backup & Segurança
- `.backup criar` - Criar backup completo
- `.backup restaurar` - Restaurar backup
- `.backup info` - Informações do backup

## 🔧 Configuração do Servidor

### IDs Importantes (configurados em `src/utils/config.js`)
```javascript
VERIFICATION_CHANNEL: '1460139282265018388'  // Canal de verificação
RECRUITMENT_CHANNEL: '1421608703882297496'   // Canal de fichas
CAPANGA_ROLE: '1419309871656075397'          // Cargo padrão
FEMALE_ROLE: '1457210009606688893'           // Cargo feminino
```

### Cargos de Staff (isentos do AutoMod)
Lista completa configurada em `SERVER_CONFIG.STAFF_ROLES`

## 🤖 Sistemas Automáticos

### AutoMod
- **Spam Detection**: Máximo 5 mensagens em 5 segundos
- **Link Protection**: Bloqueia links suspeitos e perigosos
- **Word Filter**: Sistema de palavras proibidas
- **Mass Mention**: Protege contra @everyone/@here abusivos
- **Progressive Punishment**: Sistema de punições progressivas

### Anti-Raid
- **Action Monitoring**: Monitora bans, kicks, deletações em massa
- **Automatic Response**: Punições automáticas para ações suspeitas
- **Emergency Lockdown**: Lockdown automático em situações críticas
- **Audit Log Integration**: Integração completa com logs de auditoria

### Sistema de Verificação
- **Auto Role**: Cargo "Capanga" automático ao entrar
- **Gender Selection**: Escolha de gênero via botões
- **Channel Restriction**: Acesso limitado até verificação
- **Automatic Cleanup**: Limpeza automática de mensagens

## 📊 Banco de Dados

O bot utiliza SQLite com as seguintes tabelas:
- `user_stats` - Estatísticas de usuários
- `user_history` - Histórico de alterações
- `recruitment` - Sistema de recrutamento
- `guild_config` - Configurações do servidor
- `moderation_logs` - Logs de moderação
- `channel_backups` - Backup de canais
- `role_backups` - Backup de cargos
- `automod_infractions` - Infrações do AutoMod
- `raid_events` - Eventos suspeitos

## 🔒 Segurança

### Verificações Implementadas
- ✅ Verificação de permissões
- ✅ Hierarquia de cargos
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Audit logging
- ✅ DM notifications
- ✅ Progressive punishments

### Proteções Ativas
- ✅ Anti-Spam
- ✅ Anti-Raid
- ✅ Anti-Nuke
- ✅ Link Protection
- ✅ Mass Mention Protection
- ✅ Automatic Backup
- ✅ Emergency Response

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
src/
├── commands/           # Comandos organizados por categoria
├── events/            # Eventos do Discord
├── systems/           # Sistemas (AutoMod, Anti-Raid, Backup)
├── utils/             # Utilitários (Config, Logger)
├── config.json        # Configurações
├── database.js        # Conexão com banco
└── database.sql       # Schema do banco
```

### Padrões de Código
- ES6+ Modules
- Async/Await
- Error Handling
- Logging Estruturado
- Validação de Entrada
- Documentação Inline

## 📝 Changelog v2.0

### ➕ Adicionado
- Sistema AutoMod completo
- Sistema Anti-Raid avançado
- Sistema de Verificação automática
- Sistema de Backup & Restore
- Logs centralizados
- Tratamento de erros robusto
- Notificações DM automáticas
- Sistema de configuração flexível

### ❌ Removido
- Pasta admin completa
- Comandos duplicados (avatar/avatars)
- Comandos desnecessários (auditar, sorteio, rec, banners, invite)
- Lógica obsoleta

### 🔄 Modificado
- Todos os comandos refatorados
- Verificações de segurança aprimoradas
- Interface modernizada
- Performance otimizada
- Estrutura do banco atualizada

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Desenvolvedor: **Taki**
- Versão: **2.0.0**
- Discord.js: **v14.14.1**

---

**Bot desenvolvido profissionalmente com foco em segurança, performance e escalabilidade.**