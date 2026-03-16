const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express().use(bodyParser.json());

// --- TUS DATOS CONFIGURADOS ---
const GRAPH_API_TOKEN = "EAAM68BojJm4BQ2PN66ZB8aWngP0FcRusa49w2GsimfMRtuZAKACcAvCbzqb3SZA7NWZCTWVUdrs07R2QwoyiwPAUXTPGW2arLY7ImIr8LPepByO3vLoZACK4Ef6mhEymI9otdTiksr1TRvZCcmD72GdsNkpI6NIZAuJIBRZCtuOK2g6jxCClimdARUSwzLnvc1FSwduR1G9MR3ld60YvsB1P9aCBOQyxlEZBwxfGUXk0dlCjmNleeGrRIeb5rvp0zDMOnj8Ci3ZC5NWocAjEJvrUio"; 
const PHONE_NUMBER_ID = "1077396925452694"; 
const GEMINI_API_KEY = "AIzaSyB6UroaWGqnr-ewNaLLnYdN7UUnZmIPwKY"; 
const WEBHOOK_VERIFY_TOKEN = "BOT_YAN_2026"; 
// ------------------------------

app.listen(process.env.PORT || 1337, () => console.log('Servidor con IA Gemini activo'));

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message && message.text) {
        const customerNumber = message.from;
        const customerText = message.text.body;

        try {
            // URL CAMBIADA A GEMINI-PRO (Más estable para tu cuenta)
            const geminiResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: `Eres un asistente de ventas profesional. Responde de forma muy breve: ${customerText}` }] }] }
            );

            const aiReply = geminiResponse.data.candidates[0].content.parts[0].text;

            await axios.post(
                `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: customerNumber,
                    type: "text",
                    text: { body: aiReply }
                },
                { headers: { 'Authorization': `Bearer ${GRAPH_API_TOKEN}` } }
            );

            console.log("¡Mensaje respondido con éxito!");
        } catch (error) {
            console.error("Error detallado:", error.response?.data || error.message);
        }
    }
    res.sendStatus(200);
});
