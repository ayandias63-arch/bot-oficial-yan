const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

// --- CONFIGURACIÓN DESDE RENDER ---
const GROQ_KEY = process.env.GROQ_API_KEY; 
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT; // Ejemplo: https://app.chatwoot.com

app.listen(process.env.PORT || 1337, () => {
    console.log('🚀 BOT_CHATWOOT_GROQ_ACTIVO');
    console.log(`Conectado a Cuenta: ${ACCOUNT_ID}`);
});

// Webhook para Chatwoot
app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type, account } = req.body;

    // 1. Validar que sea un mensaje entrante de un cliente
    if (event === "message_created" && message_type === "incoming") {
        const conversationId = conversation.id;
        const userMessage = content;

        console.log(`📩 Mensaje recibido: "${userMessage}" en conv: ${conversationId}`);

        try {
            // 2. LLAMADA A GROQ (IA Gratis)
            const aiRes = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "Eres un asistente de ventas profesional y servicial para una inmobiliaria." },
                        { role: "user", content: userMessage }
                    ]
                },
                { headers: { 'Authorization': `Bearer ${GROQ_KEY}` } }
            );

            const aiReply = aiRes.data.choices[0].message.content;

            // 3. ENVIAR RESPUESTA DE VUELTA A CHATWOOT
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

            console.log("✅ Respuesta enviada a Chatwoot con éxito");
        } catch (err) {
            console.error("❌ ERROR PROCESANDO:");
            if (err.response) {
                console.error(JSON.stringify(err.response.data));
            } else {
                console.error(err.message);
            }
        }
    }

    res.sendStatus(200);
});

// Mantener el GET por si Meta aún intenta validar algo
app.get('/webhook', (req, res) => {
    res.status(200).send(req.query['hub.challenge'] || "Webhook Activo");
});
