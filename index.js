const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "Eres el asistente ejecutivo de YAN AI BUSINESS. Respondes de forma profesional y concisa."
});

app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation, account } = req.body;

        // Registro de entrada (Esto es lo que ya ves en Render)
        if (message_type === 'incoming' && content) {
            console.log("📩 Mensaje recibido:", content);

            // Llamada a Gemini
            const result = await model.generateContent(content);
            const responseText = result.response.text();

            // Configuración de salida
            const baseUrl = (process.env.CHATWOOT_ENDPOINT || "").split('/webhooks')[0];
            const token = process.env.CHAT_TOKEN || process.env.CHATWOOT_TOKEN;

            await axios.post(
                `${baseUrl}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': token } }
            );
            console.log("🚀 Respuesta enviada");
        }
        res.status(200).send('ok');
    } catch (error) {
        // Aquí es donde ves el error 429 en tu imagen
        console.error("❌ Error:", error.message);
        res.status(500).send('error');
    }
});

app.listen(process.env.PORT || 10000, () => console.log("✅ Sistema Online"));
