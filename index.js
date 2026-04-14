const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// --- CONFIGURACIÓN PROFESIONAL ---
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = "Eres el Asistente Ejecutivo Senior de YAN AI BUSINESS. Tu tono es corporativo, directo y altamente profesional. Resuelves dudas de automatización y negocios con IA.";

app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account, attachments } = req.body;

        if (message_type === 'incoming') {
            const customerName = conversation.contact_name || "Cliente";
            console.log(`📩 Mensaje de ${customerName}: ${content || "[Archivo/Imagen]"}`);

            // 1. Preparar contenido multimodal (Texto e Imagen)
            let messageContent = [{ type: "text", text: content || "Analiza esta imagen" }];

            if (attachments && attachments.length > 0) {
                const imageUrl = attachments[0].data_url;
                messageContent.push({
                    type: "image_url",
                    image_url: { url: imageUrl }
                });
            }

            // 2. Llamada a OpenRouter con el ID de modelo corregido
            const aiResponse = await axios.post(OPENROUTER_URL, {
                model: "google/gemini-2.0-flash-exp", 
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: messageContent }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://yan-ai-business.com",
                    "X-Title": "Yan AI System"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            // 3. Respuesta a Chatwoot
            const baseUrl = process.env.CHATWOOT_ENDPOINT;
            await axios.post(
                `${baseUrl}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );

            console.log("🚀 Respuesta enviada con éxito");
        }
        res.status(200).send('OK');
    } catch (error) {
        // Log detallado para ver si falta saldo o hay otro error
        console.error("❌ Error en el flujo:", error.response?.data || error.message);
        res.status(500).send('Error');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`💼 YAN AI BUSINESS - Sistema listo en puerto ${PORT}`));
