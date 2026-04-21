const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;
        
        if (message_type === 'incoming' && content) {
            const aiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: process.env.AI_MODEL || "gpt-4o-mini", 
                messages: [
                    { role: "system", content: "Eres asistente de Yan AI Solutions. Responde de forma muy breve, máxima 2 frases." },
                    { role: "user", content: content }
                ]
            }, {
                headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );
        }
        res.status(200).send('OK');
    } catch (error) {
        res.status(500).send('Error');
    }
});

app.listen(process.env.PORT || 10000);
