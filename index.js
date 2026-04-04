const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

// --- VARIABLES DE ENTORNO ---
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.listen(process.env.PORT || 10000, () => {
    console.log('🚀 BOT_YAN_FINAL_V1_ACTIVO');
});

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    if (event === "message_created" && message_type === "incoming") {
        const conversationId = conversation.id;

        try {
            // URL CAMBIADA A v1 (ESTABLE)
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            
            const geminiRes = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: `Você é o assistente inteligente da YAN, agência de automação em Porto Alegre. 
                        Responda em português, de forma curta e profissional.
                        Mensagem do cliente: ${content}`
                    }]
                }]
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            const aiReply = geminiRes.data.candidates[0].content.parts[0].text;

            await axios.post(
                `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
                { content: aiReply, message_type: "outgoing" },
                { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
            );

            console.log('✅ Mensagem enviada com sucesso');

        } catch (err) {
            console.error('❌ ERROR DETECTADO:');
            if (err.response) {
                console.error('Data:', JSON.stringify(err.response.data));
                console.error('Status:', err.response.status);
            } else {
                console.error('Mensaje:', err.message);
            }
        }
    }
    res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
    res.status(200).send(req.query['hub.challenge'] || "Servidor Activo");
});
