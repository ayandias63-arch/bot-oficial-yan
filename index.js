const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express().use(bodyParser.json());

// --- TUS NUEVAS LLAVES ACTUALIZADAS ---
const GRAPH_API_TOKEN = "EAAM68BojJm4BQx9ybf8dbqUY1JPTec6Dm2OViOu4ylnVcZBNf3YjLHXQYCp7niMIlUPxcZCLtb0J91epVdzhaEZBVnqF5hDxQ2IwTyHNJeoqN0s4zrds8xPcccmS4vZA0GdfMrjpM8yvDqX9JZAZCqpLm4HOj0zZBBVVHxRajz718xldUamlzH2NBI1uzNsmooIDDcJkzSRHOSJHiVEkJ6RgAC7tIIuI9F83SGaoyZAQkQAJuyQZBPVPFQleFvKVhjpn523uphlgmE8VWtZAFOwTpa"; 
const PHONE_NUMBER_ID = "1077396925452694"; 
const GEMINI_API_KEY = "AIzaSyAZY6yLc62RoF_D3mgU_Gvw0nKzDh5HgtQ"; 
const WEBHOOK_VERIFY_TOKEN = "BOT_YAN_2026"; 

app.listen(process.env.PORT || 1337, () => console.log('BOT_REINICIADO_CON_NUEVAS_LLAVES'));

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
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.text) {
        const from = message.from;
        const text = message.text.body;

        try {
            // Llamada a Google Gemini 1.5 Flash
            const response = await axios({
                method: 'POST',
                url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY,
                data: { contents: [{ parts: [{ text: "Eres un asistente de ventas profesional. Responde de forma amable y breve a esto: " + text }] }] }
            });

            const reply = response.data.candidates[0].content.parts[0].text;

            // Enviar respuesta a WhatsApp
            await axios({
                method: 'POST',
                url: 'https://graph.facebook.com/v18.0/' + PHONE_NUMBER_ID + '/messages',
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    type: "text",
                    text: { body: reply }
                },
                headers: { 'Authorization': 'Bearer ' + GRAPH_API_TOKEN }
            });
            
            console.log("¡Mensaje enviado con éxito!");
        } catch (err) {
            console.log("ERROR:", err.response ? JSON.stringify(err.response.data) : err.message);
        }
    }
    res.sendStatus(200);
});
