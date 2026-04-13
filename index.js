const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
app.use(express.json());

// 1. Configuración de Inteligencia Artificial
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "Eres el asistente ejecutivo senior de YAN AI BUSINESS. Tu tono es profesional, eficiente y servicial. Respondes de forma concisa y resuelves dudas sobre automatización con IA. Si no sabes algo, ofreces contactar con un especialista humano."
});

// 2. Webhook Principal para WhatsApp (Chatwoot)
app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;

        // Rastreo profesional en los logs de Render
        if (content) {
            console.log("📩 ¡Mensaje recibido desde Chatwoot!", content);
        }

        // Filtro: Solo respondemos si el mensaje viene de un cliente (evita bucles infinitos)
        if (message_type === 'incoming' && content) {
            
            // Generar respuesta con Gemini
            const result = await model.generateContent(content);
            const responseText = result.response.text();

            // Limpiar la URL del endpoint para evitar errores de ruta
            const rawEndpoint = process.env.CHATWOOT_ENDPOINT || "";
            const baseUrl = rawEndpoint.split('/webhooks')[0];
            
            // Usar el Token de acceso personal de Chatwoot
            const apiToken = process.env.CHAT_TOKEN || process.env.CHATWOOT_TOKEN;

            // Enviar respuesta de vuelta al cliente en WhatsApp
            await axios.post(
                `${baseUrl}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { 
                    content: responseText, 
                    message_type: "outgoing" 
                },
                { 
                    headers: { 'api_access_token': apiToken } 
                }
            );
            
            console.log("🚀 Respuesta de IA enviada con éxito");
        }

        res.status(200).send('Event received');
    } catch (error) {
        console.error("❌ Error en el sistema:", error.message);
        res.status(500).send('Internal Server Error');
    }
});

// 3. Inicio del Servidor Enterprise
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 YAN AI BUSINESS - SISTEMA ACTIVO`);
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`=========================================\n`);
});
