const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/chatwoot/webhook', async (req, res) => {
    // 1. Respondemos rápido a Chatwoot para evitar que reintente el envío
    res.status(200).send('OK');

    try {
        const { content, message_type, conversation, account } = req.body;

        // Validamos que sea un mensaje entrante y que tenga texto
        if (message_type === 'incoming' && content) {
            console.log(`📩 Mensaje recibido: ${content}`);

            // 2. Llamada a OpenAI
            const aiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: process.env.AI_MODEL || "gpt-4o-mini", 
                messages: [
                    { role: "system", content: "Eres asistente de Yan AI Solutions. Responde de forma muy breve, máximo 2 frases." },
                    { role: "user", content: content }
                ]
            }, {
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            // 3. Enviar respuesta de vuelta a Chatwoot
            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { 
                    content: responseText, 
                    message_type: "outgoing" 
                },
                { 
                    headers: { 'api_access_token': process.env.CHAT_TOKEN } 
                }
            );

            console.log(`🚀 Respondido: ${responseText}`);
        }
    } catch (error) {
        // Log detallado por si algo falla (puedes verlo en los Logs de Render)
        console.error("❌ Error en el proceso:", error.response?.data || error.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Yan AI activo en puerto ${PORT}`);
});
