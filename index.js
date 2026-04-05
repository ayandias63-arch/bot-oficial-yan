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
        // 1. BUSCAR HISTORIAL PARA MEMORIA
        const historyRes = await axios.get(
            `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { headers: { 'api_access_token': CHATWOOT_TOKEN } }
        );

        const allMessages = historyRes.data.payload || [];
        // Detectamos si es el primer mensaje del bot
        const botMessages = allMessages.filter(m => m.message_type === "outgoing");
        const isFirstContact = botMessages.length === 0;

        // Limitar historial a los últimos 8 para no saturar
        const contextMessages = allMessages.slice(-8).map(m => ({
            role: m.message_type === "incoming" ? "user" : "assistant",
            content: m.content || ""
        }));

        // 2. PROMPT DINÁMICO SEGÚN EL ESTADO DE LA CONVERSA
        const systemInstruction = `Você é o Yan, agente de IA da YAN AI Solutions. 
        
        REGRAS DE OURO:
        ${isFirstContact ? 'ESTA É A PRIMEIRA MENSAGEM: Diga "Opa, tudo bem?" e apresente-se como "Yan, agente de IA".' : 'A CONVERSA JÁ COMEÇOU: Proibido dizer "Opa", "Olá" ou se apresentar de novo. Vá direto ao assunto.'}
        
        - FORMATO: Máximo 2 parágrafos (total de 8 a 9 linhas). Use quebras de linha.
        - FOCO: Marcar reunião. Se perguntarem preço: Pequenos (R$97-190), Médios (R$297-997), Grandes (R$997+).
        - Nunca responda com textos gigantes. Termine sempre com uma pergunta curta.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemInstruction },
                ...contextMessages,
                { role: "user", content: content } // Aseguramos que el mensaje actual sea el último
            ],
            temperature: 0.6 // Bajamos un poco la temperatura para que sea más estable
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

    } catch (e) {
        console.log("❌ Erro:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 YAN_V4_FIX_GREETING'));
