const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    if (event === "message_created" && message_type === "incoming") {
        try {
            // USANDO GROQ (MODELO LLAMA 3) - Súper rápido
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Você é o assistente oficial da YAN. Responda em português de forma curta e profissional." },
                    { role: "user", content: content }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
            });

            const aiReply = response.data.choices[0].message.content;

            await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
                { content: aiReply, message_type: "outgoing" },
                { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
            );
            console.log("✅ Groq respondió con éxito");
        } catch (e) {
            console.log("❌ Error Groq:", e.response ? JSON.stringify(e.response.data) : e.message);
        }
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 BOT_YAN_GROQ_READY'));
