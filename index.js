const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.listen(process.env.PORT || 10000, () => {
    console.log('🚀 BOT_CHATWOOT_GEMINI_ACTIVO');
});

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    if (event === "message_created" && message_type === "incoming") {
        const conversationId = conversation.id;
        const userMessage = content;

        try {
            // CAMBIO: Usamos v1 y el modelo gemini-pro (que es el estándar global)
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_KEY}`;
            
            const geminiRes = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: `Você é o assistente da YAN, agência de automação de WhatsApp com IA em Porto Alegre. Responda em português. Mensagem: ${userMessage}`
                    }]
                }]
            });

            const aiReply = geminiRes.data.candidates[0].content.parts[0].text;

            await axios.post(
                `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
                { content: aiReply, message_type: "outgoing" },
                { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
            );
            console.log('✅ Enviado');
        } catch (err) {
            console.error('❌ Erro completo:', err.response ? JSON.stringify(err.response.data) : err.message);
        }
    }
    res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
    res.status(200).send(req.query['hub.challenge'] || "Webhook Activo");
});
