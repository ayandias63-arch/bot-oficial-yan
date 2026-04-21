const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;
        
        // Solo respondemos a mensajes que entran y que tienen texto
        if (message_type === 'incoming' && content) {
            console.log(`📩 Recibido: ${content}`);

            // Conexión Directa con Grok
            const aiResponse = await axios.post("https://api.x.ai/v1/chat/completions", {
                model: process.env.AI_MODEL || "grok-2", 
                messages: [
                    { 
                        role: "system", 
                        content: "Eres el asistente oficial de Yan AI Solutions. Tu dueño es Ayan Diaz Palmas. Responde de forma profesional y amable." 
                    },
                    { role: "user", content: content }
                ]
            }, {
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            // Enviar respuesta de vuelta a Chatwoot
            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );
            
            console.log("🚀 Respuesta enviada con Grok correctamente");
        }
        res.status(200).send('OK');
    } catch (error) {
        // Log detallado para saber si falla la llave o el mensaje
        console.error("❌ Error Detallado:", error.response?.data || error.message);
        res.status(500).send('Error');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Yan AI Solutions corriendo en puerto ${PORT}`);
});
