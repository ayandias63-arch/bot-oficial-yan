const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;
        
        if (message_type === 'incoming') {
            console.log(`📩 Recibido: ${content}`);

            const aiResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: "openrouter/auto", 
                messages: [{ role: "user", content: content || "Hola" }]
            }, {
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );
            console.log("🚀 Enviado con Auto");
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
        res.status(500).send('Error');
    }
});

app.listen(process.env.PORT || 10000);
