# 🧪 CASOS DE TESTE - SISTEMA DE TAGS

## ✅ REGRA IMPLEMENTADA
**Usuário só pode escolher HOMEM ou MULHER UMA ÚNICA VEZ**

---

## 📋 CENÁRIOS DE TESTE

### 🟢 CENÁRIO 1: Primeira Escolha (HOMEM)
**Usuário:** Novo membro sem cargos de gênero
**Ação:** Clica no botão "👨 HOMEM"
**Resultado Esperado:**
- ✅ Recebe cargo `1419309871656075397` (Capanga)
- ✅ Remove cargo `1457231923830067325` (Não Verificado)
- ✅ Recebe confirmação ephemeral de sucesso
- ✅ DM de log enviada para `367813556554563594`

### 🟢 CENÁRIO 2: Primeira Escolha (MULHER)
**Usuário:** Novo membro sem cargos de gênero
**Ação:** Clica no botão "👩 MULHER"
**Resultado Esperado:**
- ✅ Recebe cargo `1457210009606688893` (Dolls)
- ✅ Remove cargo `1457231923830067325` (Não Verificado)
- ✅ Recebe confirmação ephemeral de sucesso
- ✅ DM de log enviada para `367813556554563594`

### 🔴 CENÁRIO 3: Tentativa de Troca (HOMEM → MULHER)
**Usuário:** Já possui cargo Capanga (`1419309871656075397`)
**Ação:** Clica no botão "👩 MULHER"
**Resultado Esperado:**
- ❌ **BLOQUEADO** - Nenhuma ação executada
- ❌ Não remove cargo atual
- ❌ Não adiciona novo cargo
- ❌ Não envia DM de log
- ✅ Apenas resposta ephemeral: "Você já escolheu um gênero. Essa ação não pode ser alterada."

### 🔴 CENÁRIO 4: Tentativa de Troca (MULHER → HOMEM)
**Usuário:** Já possui cargo Dolls (`1457210009606688893`)
**Ação:** Clica no botão "👨 HOMEM"
**Resultado Esperado:**
- ❌ **BLOQUEADO** - Nenhuma ação executada
- ❌ Não remove cargo atual
- ❌ Não adiciona novo cargo
- ❌ Não envia DM de log
- ✅ Apenas resposta ephemeral: "Você já escolheu um gênero. Essa ação não pode ser alterada."

### 🔴 CENÁRIO 5: Spam de Cliques
**Usuário:** Já fez uma escolha anteriormente
**Ação:** Clica repetidamente em qualquer botão
**Resultado Esperado:**
- ❌ **BLOQUEADO** - Todas as tentativas após a primeira
- ✅ Sempre resposta ephemeral de bloqueio

---

## 🔍 VERIFICAÇÃO TÉCNICA

### Lógica de Verificação:
```javascript
const hasAnyGenderRole = 
    (maleRole && member.roles.cache.has(maleRole.id)) ||
    (femaleRole && member.roles.cache.has(femaleRole.id));

if (hasAnyGenderRole) {
    // BLOQUEAR COMPLETAMENTE
    return await interaction.reply({
        content: '❌ **Você já escolheu um gênero. Essa ação não pode ser alterada.**',
        ephemeral: true
    });
}
```

### IDs dos Cargos:
- **Homem (Capanga):** `1419309871656075397`
- **Mulher (Dolls):** `1457210009606688893`
- **Não Verificado:** `1457231923830067325`

---

## ✅ STATUS DA IMPLEMENTAÇÃO
**TODOS OS CASOS DE TESTE IMPLEMENTADOS E FUNCIONANDO**

- ✅ Verificação no início do handler
- ✅ Bloqueio absoluto após primeira escolha
- ✅ Sem exceções ou brechas
- ✅ Mensagem de bloqueio clara
- ✅ Sistema robusto contra spam
