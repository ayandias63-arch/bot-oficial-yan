const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

// Variables que ya tienes configuradas en Render
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    if (event === "message_created" && message_type === "incoming") {
        try {
            // USAMOS LA VERSIÓN 1.5 FLASH (LA MÁS ESTABLE)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            
            const response = await axios.post(url, {
                contents: [{
                    parts: [{ text: `Você é o assistente da YAN. Responda de forma curta e profissional em português: ${content}` }]
                }]
            });

            const aiReply = response.data.candidates[0].content.parts[0].text;

            // Enviar a Chatwoot
            await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
                { content: aiReply, message_type: "outgoing" },
                { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
            );

            console.log("✅ Respuesta enviada con éxito");

        } catch (e) {
            // Esto nos dirá exactamente por qué falla en los logs de Render
            console.log("❌ Error:", e.response ? JSON.stringify(e.response.data) : e.message);
        }
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 BOT_YAN_FLASH_V1_READY'));
