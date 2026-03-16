const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express().use(bodyParser.json());

const META_TOKEN = "EAAM68BojJm4BQ9CTEcRsnP7kleqxhm8tA2vssroFTVmfJKWyafBTyo64cnhobIYwsm78809XX6RRGxfZC9AC7L9k44Q5yM21fjJs9hPZAPjXhozBLQeI88Kg1DCO2saGCB6QwVXbJvhM7LZAcCSUsHiXrdZBAnZBZBZBQ6hUhjO6ZCRokudr20sebBDkapBaOaYXStZAhdzQq1Bhey5f1MvvtCRk0XbRtZA46e1oLMRkBKbZCxMSTJrdVUEA284qq7le0qV1dZABu2IXhSltZBOi2oHP8";
const GEMINI_KEY = "AIzaSyAPL33oHMcdf_qKPEiBvyM-7p7otsbG080";
const PHONE_ID = "1077396925452694";
const VERIFY_TOKEN = "BOT_YAN_2026";

app.listen(process.env.PORT || 1337, () => console.log('BOT_NUEVA_ESTRATEGIA_ONLINE'));

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

    // Respuesta inmediata a Meta
    res.sendStatus(200);

    if (message && message.text) {
        const from = message.from;
        const text = message.text.body;

        try {
            // URL de Google más compatible del mundo
            const response = await axios({
                method: 'post',
                url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
                data: { contents: [{ parts: [{ text: text }] }] }
            });

            const aiReply = response.data.candidates[0].content.parts[0].text;

            await axios.post(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
                messaging_product: "whatsapp",
                to: from,
                type: "text",
                text: { body: aiReply }
            }, {
                headers: { 'Authorization': `Bearer ${META_TOKEN}` }
            });
            
            console.log("¡MENSAJE ENVIADO!");
        } catch (err) {
            console.log("ERROR:", err.response ? err.response.data : err.message);
        }
    }
});
