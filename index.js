const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express().use(bodyParser.json());

// --- CONFIGURACIÓN CON IA GRATUITA (GROQ) ---
// Estos datos son fijos, el código buscará la llave en Render
const META_TOKEN = "EAAM68BojJm4BQ7n562nmYZAOG7BNhaO5ovIqXNxTee0ZAw3BHsvjiDW36QEdURHDvnUJ818K1NMkY1BwZCyig4MtDl0y4KGZAPcwZAsSZBT6JF1sUKAT3LxXEhbO3MMcbbCe8ZA5JqOCKQVz0Mn8ZBGlt7ZBSFdFu2oFINnH8ljBzoljQrqY6ZAdt2ZByTsmbudzQZDZD";
const PHONE_ID = "1077396925452694";
const VERIFY_TOKEN = "BOT_YAN_2026";
const GROQ_KEY = process.env.OPENAI_KEY; // <--- SEGURO: Toma la llave gsk_... de Render

app.listen(process.env.PORT || 1337, () => console.log('BOT_GROQ_ACTIVO_Y_GRATIS'));

// Webhook para validación de Meta
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
    const value = changes?.value;
    const message = value?.messages?.[0];

    // Respuesta rápida a Meta
    res.sendStatus(200);

    if (message && message.text) {
        const from = message.from;
        const text = message.text.body;

        try {
            // 1. LLAMADA A GROQ (Llama 3 - IA Gratis)
            const aiRes = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "Eres un asistente de ventas profesional y servicial." },
                        { role: "user", content: text }
                    ]
                },
                { headers: { 'Authorization': `Bearer ${GROQ_KEY}` } }
            );

            const aiReply = aiRes.data.choices[0].message.content;

            // 2. ENVÍO DEL MENSAJE A WHATSAPP
            await axios.post(
                `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: from,
                    type: "text",
                    text: { body: aiReply }
                },
                { headers: { 'Authorization': `Bearer ${META_TOKEN}` } }
            );
            
            console.log("¡Mensaje enviado con éxito!");
        } catch (err) {
            console.log("ERROR:", err.response ? JSON.stringify(err.response.data) : err.message);
        }
    }
});
