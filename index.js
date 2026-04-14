const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// --- CONFIGURACIÓN PROFESIONAL ---
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = "Eres el Asistente Ejecutivo Senior de YAN AI BUSINESS. Tu tono es corporativo, directo y altamente profesional.";

app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;

        if (message_type === 'incoming') {
            const customerName = conversation.contact_name || "Cliente";
            console.log(`📩 Mensaje de ${customerName}: ${content}`);

            // 1. Llamada a OpenRouter usando GEMINI 2.0 FLASH LITE (GRATIS)
            const aiResponse = await axios.post(OPENROUTER_URL, {
                model: "google/gemini-2.0-flash-lite-preview-02-05:free", 
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: content || "Hola" }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "X-Title": "Yan AI System"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            // 2. Respuesta a Chatwoot
            const baseUrl = process.env.CHATWOOT_ENDPOINT;
            await axios.post(
                `${baseUrl}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );

            console.log("🚀 Respuesta enviada con Gemini Gratis");
        }
        res.status(200).send('OK');
    } catch (error) {
        // Log detallado para ver por qué falla si es el caso
        console.error("❌ Error en el flujo:", error.response?.data || error.message);
        res.status(500).send('Error');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`💼 YAN AI BUSINESS - Probando Gemini Gratis en puerto ${PORT}`));
