const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express().use(bodyParser.json());

// --- TUS DATOS CARGADOS ---
const META_TOKEN = "EAAM68BojJm4BQ9CTEcRsnP7kleqxhm8tA2vssroFTVmfJKWyafBTyo64cnhobIYwsm78809XX6RRGxfZC9AC7L9k44Q5yM21fjJs9hPZAPjXhozBLQeI88Kg1DCO2saGCB6QwVXbJvhM7LZAcCSUsHiXrdZBAnZBZBZBQ6hUhjO6ZCRokudr20sebBDkapBaOaYXStZAhdzQq1Bhey5f1MvvtCRk0XbRtZA46e1oLMRkBKbZCxMSTJrdVUEA284qq7le0qV1dZABu2IXhSltZBOi2oHP8";
const GEMINI_KEY = "AIzaSyAPL33oHMcdf_qKPEiBvyM-7p7otsbG080";
const PHONE_ID = "1077396925452694";
const VERIFY_TOKEN = "BOT_YAN_2026";

app.listen(process.env.PORT || 1337, () => console.log('BOT_ENCENDIDO_Y_LISTO'));

// Verificación para Meta
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// Recepción de mensajes
app.post('/webhook', async (req, res) => {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message && message.text) {
        const from = message.from;
        const text = message.text.body;

        try {
            // 1. Llamada a la IA (Gemini 1.5 Flash)
            const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY;
            const geminiRes = await axios.post(geminiUrl, {
                contents: [{ parts: [{ text: "Responde de forma breve y profesional: " + text }] }]
            });

            const aiReply = geminiRes.data.candidates[0].content.parts[0].text;

            // 2. Enviar respuesta a WhatsApp
            const metaUrl = "https://graph.facebook.com/v18.0/" + PHONE_ID + "/messages";
            await axios.post(metaUrl, {
                messaging_product: "whatsapp",
                to: from,
                type: "text",
                text: { body: aiReply }
            }, {
                headers: { 'Authorization': 'Bearer ' + META_TOKEN }
            });

            console.log("Respuesta enviada a: " + from);
        } catch (err) {
            console.log("DETALLE DEL ERROR:", err.response ? JSON.stringify(err.response.data) : err.message);
        }
    }
    res.sendStatus(200);
});
