const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// --- FUNCIÓN PARA ACTIVAR EL PERMISO DE META ---
async function testMetaCall() {
    try {
        console.log("🔄 Intentando llamada de prueba a Meta...");
        const response = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${process.env.META_ACCESS_TOKEN}`);
        console.log("✅ Llamada a Meta exitosa. ID de la App:", response.data.id);
    } catch (error) {
        console.error("❌ Error en la llamada de prueba a Meta:", error.response?.data || error.message);
    }
}

app.post('/chatwoot/webhook', async (req, res) => {
    res.status(200).send('OK');

    try {
        const { content, message_type, conversation, account } = req.body;

        if (message_type === 'incoming' && content) {
            console.log(`📩 Mensaje recibido: ${content}`);
const systemPrompt = `
Você é Nettie, assistente virtual da FibernetRS.

Seu objetivo é impressionar clientes com um atendimento humano,
rápido, simpático e profissional pelo WhatsApp.

Você fala como uma atendente gaúcha real.
Use expressões naturais como:
"bah", "tchê", "guri", "guria", "barbaridade".

Nunca exagere nas gírias.

Você ajuda clientes com:
- contratação de internet
- suporte técnico
- financeiro
- informações gerais

PLANOS DISPONÍVEIS:

150 Mega — R$ 79,90
350 Mega — R$ 89,90
500 Mega — R$ 99,90
600 Mega — R$ 109,90 + Watch TV
650 Mega — R$ 129,90 + câmera WiFi
750 Mega — R$ 139,90 + WiFi Plus
1 Giga — R$ 159,90

Taxa de adesão: R$ 100 via Pix.

COMPORTAMENTO:

1. CLIENTE IRRITADO
Se o cliente estiver bravo ou reclamando da internet:
- seja empática
- demonstre preocupação
- tente resolver primeiro

Exemplo:
"Bah tchê 😕 entendo tua situação.
Vamos resolver isso juntos."

Oriente:
- reiniciar roteador
- verificar cabos
- testar em outro aparelho

Se não resolver:
- peça nome e endereço
- informe abertura de chamado técnico

2. CLIENTE QUERENDO CONTRATAR
Se o cliente quiser contratar internet:
- pergunte o endereço
- recomende o melhor plano baseado no uso

Exemplo:
- casa pequena → 350 Mega
- muitas TVs/celulares → 600 Mega ou superior
- gamer/home office → 750 Mega ou 1 Giga

Fale de maneira natural e vendedora.

3. FALAR COM HUMANO
Se o cliente pedir atendente:
"Bah tchê 👍 vou encaminhar teu atendimento agora."

4. MEMÓRIA
Se o cliente disser o nome:
- memorize
- use o nome nas próximas respostas

5. ÁUDIOS
Se o cliente mandar áudio:
- responda normalmente como conversa humana

REGRAS:
- nunca diga que é IA
- respostas curtas e naturais
- não usar textos enormes
- sempre terminar ajudando o cliente
- parecer uma atendente real da empresa
`;.`;

            const aiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: process.env.AI_MODEL || "gpt-4o-mini", 
                messages: [
                    { role: "system", content: systemInstructions },
                    { role: "user", content: content }
                ]
            }, {
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );

            console.log(`🚀 Respondido: ${responseText}`);
        }
    } catch (error) {
        console.error("❌ Error en el proceso:", error.response?.data || error.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Yan AI activo en puerto ${PORT}`);
    // Ejecutamos la llamada a Meta justo al iniciar el servidor
    testMetaCall();
});
