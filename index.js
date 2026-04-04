const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

// Objeto para evitar mensajes duplicados (caché temporal)
const processedMessages = new Set();

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type, id } = req.body;

    // 1. Responder rápido a Chatwoot para que no reenvíe el mensaje
    res.sendStatus(200);

    // 2. Filtros de seguridad
    if (event !== "message_created" || message_type !== "incoming") return;
    if (processedMessages.has(id)) return; // Si ya procesamos este ID, lo ignoramos

    processedMessages.add(id);
    setTimeout(() => processedMessages.delete(id), 30000); // Limpiar ID después de 30 seg

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: `Você é o Yan da YAN AI Solutions. Seu objetivo: Vender automação de WhatsApp para empresas.
                    REGRA DE OURO: Responda em no máximo 2 frases curtas. Seja direto e profissional. 
                    Sempre tente agendar uma demonstração ou perguntar o nome da empresa do cliente.` 
                },
                { role: "user", content: content }
            ],
            max_tokens: 100 // Limita físicamente el tamaño de la respuesta
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

app.listen(process.env.PORT || 10000, () => console.log('🚀 BOT_YAN_SIN_DUPLICADOS'));
