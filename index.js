const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

// --- VARIABLES DE RENDER ---
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.listen(process.env.PORT || 10000, () => {
    console.log('🚀 BOT_YAN_ESTABLE_CONECTADO');
});

// Webhook para recibir mensajes de Chatwoot
app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    // Solo respondemos a mensajes nuevos que vienen del cliente
    if (event === "message_created" && message_type === "incoming") {
        const conversationId = conversation.id;
        const userMessage = content;

        try {
            // URL CORREGIDA: Usando modelo estándar para evitar error 404
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            
            const geminiRes = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: `Você é o assistente oficial da YAN (Agência de Automação). 
                        Responda sempre em português, de forma curta e profissional.
                        Sua missão é ajudar o cliente.
                        Mensagem do cliente: ${userMessage}`
                    }]
                }]
            });

            // Extraer la respuesta de la IA
            const aiReply = geminiRes.data.candidates[0].content.parts[0].text;

            // Enviar la respuesta de vuelta a Chatwoot
            await axios.post(
                `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
                {
                    content: aiReply,
                    message_type: "outgoing"
                },
                {
                    headers: {
                        'api_access_token': CHATWOOT_TOKEN,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Mensaje enviado con éxito');

        } catch (err) {
            console.error('❌ ERROR EN EL PROCESO:');
            // Esto imprimirá el error exacto en los logs de Render para saber qué pasa
            if (err.response) {
                console.error(JSON.stringify(err.response.data));
            } else {
                console.error(err.message);
            }
        }
    }
    res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
    res.status(200).send(req.query['hub.challenge'] || "Servidor en línea");
});
