const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "Eres el asistente ejecutivo senior de YAN AI BUSINESS. Tu tono es profesional, eficiente y servicial. Respondes de forma concisa y resuelves dudas sobre automatización con IA. Si no sabes algo, ofreces contactar con un especialista humano."
});

// Webhook para Chatwoot (WhatsApp)
app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;

        // Evitamos bucles: solo respondemos mensajes que vienen del cliente
        if (message_type === 'incoming') {
            const result = await model.generateContent(content);
            const responseText = result.response.text();

            // Enviamos la respuesta de vuelta a Chatwoot usando tus variables de Render
            // Nota: Se asume que CHATWOOT_ENDPOINT es la base (ej: https://app.chatwoot.com)
            const baseUrl = process.env.CHATWOOT_ENDPOINT.split('/webhooks')[0];
            
            await axios.post(
                `${baseUrl}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN || process.env.CHATWOOT_TOKEN } }
            );
        }
        res.status(200).send('Event received');
    } catch (error) {
        console.error("Error en el sistema:", error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Puerto de Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Sistema Enterprise activo en puerto ${PORT}`));
