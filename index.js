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
        // 1. OBTENER TODO EL HISTORIAL (MEMORIA COMPLETA)
        const historyRes = await axios.get(
            `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { headers: { 'api_access_token': CHATWOOT_TOKEN } }
        );

        const allMessages = historyRes.data.payload || [];
        
        // Contamos cuántas veces ha respondido el bot anteriormente
        const botResponses = allMessages.filter(m => m.message_type === "outgoing").length;
        const isFirstMessage = botResponses === 0;

        // Mapeamos el historial completo para la IA (Máximo 10 mensajes para no saturar)
        const historyForAI = allMessages.slice(-10).map(m => ({
            role: m.message_type === "incoming" ? "user" : "assistant",
            content: m.content || ""
        }));

        // 2. PROMPT CON LÓGICA DE ESTADO
        const systemPrompt = `Você é o Yan, agente de IA da YAN AI Solutions. 
        
        CONTEXTO DE CONVERSA:
        ${isFirstMessage 
            ? 'A conversa está COMEÇANDO agora. Saudação obrigatória: "Opa, tudo bem? Sou o Yan, agente de IA...".' 
            : 'A conversa JÁ ESTÁ EM ANDAMENTO. PROIBIDO saudações (Opa, Olá, Tudo bem) e PROIBIDO se apresentar novamente. Vá direto ao ponto da dúvida do cliente.'}

        REGRAS:
        - FORMATO: Máximo 2 parágrafos (total de 8 a 9 linhas). Use quebras de linha.
        - PREÇOS: R$97-190 (Pequeno), R$297-997 (Médio), R$997+ (Grande).
        - MEMÓRIA: Use o histórico para responder de forma coerente.
        - FINALIZAÇÃO: Termine sempre com uma pergunta curta para avançar a venda.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...historyForAI
            ],
            temperature: 0.5 // Baja para que obedezca la instrucción de no saludar
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        // 3. ENVIAR RESPUESTA A CHATWOOT
        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

    } catch (e) {
        console.log("❌ Erro:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 YAN_MEMORIA_INTELIGENTE_ON'));
