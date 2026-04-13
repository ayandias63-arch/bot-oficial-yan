const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); // Necesario para responder de vuelta a Chatwoot

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// RUTA PARA CHATWOOT (WhatsApp)
app.post('/chatwoot/webhook', async (req, res) => {
    try {
        const { content, message_type, conversation } = req.body;

        // Solo respondemos si es un mensaje entrante de un cliente
        if (message_type === 'incoming') {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            // Enviamos el mensaje del cliente a Gemini
            const result = await model.generateContent(content);
            const aiResponse = result.response.text();

            // Enviamos la respuesta de Gemini de vuelta a Chatwoot
            await axios.post(
                `${process.env.CHAT_ENDPOINT}/api/v1/accounts/1/conversations/${conversation.id}/messages`,
                { content: aiResponse, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
            );
        }
        res.status(200).send('ok');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('error');
    }
});

app.listen(10000, () => console.log("IA conectada a WhatsApp mediante Chatwoot"));
