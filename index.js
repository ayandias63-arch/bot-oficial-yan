const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express().use(bodyParser.json());

// --- CONFIGURACIÓN ACTUALIZADA ---
const META_TOKEN = "EAAM68BojJm4BQ9CTEcRsnP7kleqxhm8tA2vssroFTVmfJKWyafBTyo64cnhobIYwsm78809XX6RRGxfZC9AC7L9k44Q5yM21fjJs9hPZAPjXhozBLQeI88Kg1DCO2saGCB6QwVXbJvhM7LZAcCSUsHiXrdZBAnZBZBZBQ6hUhjO6ZCRokudr20sebBDkapBaOaYXStZAhdzQq1Bhey5f1MvvtCRk0XbRtZA46e1oLMRkBKbZCxMSTJrdVUEA284qq7le0qV1dZABu2IXhSltZBOi2oHP8";
const OPENAI_KEY = "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";
const PHONE_ID = "1077396925452694";
const VERIFY_TOKEN = "BOT_YAN_2026";

app.listen(process.env.PORT || 1337, () => console.log('BOT_CHATGPT_ONLINE'));

// Webhook para Meta
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    // Responder a Meta para que no reintente
    res.sendStatus(200);

    if (message && message.text) {
        const from = message.from;
        const text = message.text.body;

        try {
            // 1. Llamada a OpenAI (ChatGPT)
            const aiRes = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Eres un asistente de ventas profesional y amable." },
                        { role: "user", content: text }
                    ]
                },
                { headers: { 'Authorization': 'Bearer ' + OPENAI_KEY } }
            );

            const aiReply = aiRes.data.choices[0].message.content;

            // 2. Enviar a WhatsApp
            await axios.post(
                "https://graph.facebook.com/v18.0/" + PHONE_ID + "/messages",
                {
                    messaging_product: "whatsapp",
                    to: from,
                    type: "text",
                    text: { body: aiReply }
                },
                { headers: { 'Authorization': 'Bearer ' + META_TOKEN } }
            );
            
            console.log("¡Respondido con ChatGPT a: " + from + "!");
        } catch (err) {
            console.log("ERROR:", err.response ? JSON.stringify(err.response.data) : err.message);
        }
    }
});
