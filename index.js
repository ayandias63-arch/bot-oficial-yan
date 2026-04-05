const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

const processedMessages = new Set();

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type, id } = req.body;
    res.sendStatus(200);

    if (event !== "message_created" || message_type !== "incoming") return;
    if (processedMessages.has(id)) return;
    processedMessages.add(id);
    setTimeout(() => processedMessages.delete(id), 30000);

    try {
        // 1. BUSCAR HISTORIAL DE CHATWOOT PARA TENER MEMORIA
        const historyRes = await axios.get(
            `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { headers: { 'api_access_token': CHATWOOT_TOKEN } }
        );

        // Filtramos solo los últimos 6 mensajes para que la IA tenga contexto
        const lastMessages = historyRes.data.payload.slice(-6).map(m => ({
            role: m.message_type === "incoming" ? "user" : "assistant",
            content: m.content
        }));

        // 2. CONFIGURAR EL CEREBRO CON LAS NUEVAS REGLAS
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: `Você é o Yan, agente de IA da YAN AI Solutions.
                    
                    REGRAS DE COMPORTAMENTO:
                    - Se for o INÍCIO da conversa: Use "Opa, tudo bem?" e apresente-se como "Yan, agente de IA".
                    - Se a conversa JÁ ESTIVER EM ANDAMENTO: Não repita saudações nem apresentações. Vá direto ao ponto.
                    - FORMATO: Máximo de 2 parágrafos (8 a 9 linhas no total). Use quebras de linha para ficar legível.
                    - ESTILO: Humano, persuasivo e focado em marcar reuniões. 
                    - PREÇOS: R$ 97-190 (Pequeno), R$ 297-997 (Médio), R$ 997+ (Grande).
                    - SEMPRE termine com uma pergunta curta.` 
                },
                ...lastMessages // Aquí le pasamos la memoria de la conversación
            ],
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        // 3. ENVIAR RESPUESTA
        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

    } catch (e) {
        console.log("❌ Erro:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 YAN_V3_MEMORIA_ON'));
