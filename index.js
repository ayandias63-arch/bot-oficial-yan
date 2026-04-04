const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;
    if (event === "message_created" && message_type === "incoming") {
        try {
            // USANDO LA RUTA DIRECTA Y ESTABLE
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: `Responda de forma curta: ${content}` }] }]
            });

            const aiReply = response.data.candidates[0].content.parts[0].text;

            await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
                { content: aiReply, message_type: "outgoing" },
                { headers: { 'api_access_token': CHATWOOT_TOKEN } }
            );
            console.log("✅ Enviado");
        } catch (e) {
            console.log("❌ Error:", e.response ? e.response.data.error.message : e.message);
        }
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 BOT_FLASH_READY'));
