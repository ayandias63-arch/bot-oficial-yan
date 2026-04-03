const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

// --- CONFIGURACIÓN DESDE RENDER ---
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.listen(process.env.PORT || 10000, () => {
    console.log('🚀 BOT_CHATWOOT_GEMINI_ACTIVO');
    console.log(`Conectado a Cuenta: ${ACCOUNT_ID}`);
});

// Webhook para Chatwoot
app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    if (event === "message_created" && message_type === "incoming") {
        const conversationId = conversation.id;
        const userMessage = content;

        console.log(`📩 Mensagem recebida: "${userMessage}"`);

        try {
            // URL DEFINITIVA: Con v1beta y el prefijo models/
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            
            const geminiRes = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: `Você é o assistente inteligente da YAN, uma agência líder em automação de WhatsApp com IA. Sua missão é converter interessados em clientes. 
                        O que a YAN faz: Atendimento 24/7, IAs inteligentes, Agendamento Automático via Make.com e integração total. 
                        Fale de forma clara, amigável e profissional em português. Foco nos benefícios: economizar tempo e aumentar lucro. 
                        Se o cliente tiver interesse, peça o Nome e Ramo da Empresa para agendar uma demonstração rápida.
                        Mensagem do cliente: ${userMessage}`
                    }]
                }]
            });
                    }]
                }]
            });

            // Validación de respuesta de la IA
            const aiReply = geminiRes.data.candidates[0].content.parts[0].text;

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

            console.log('✅ Resposta enviada com sucesso');
        } catch (err) {
            console.error('❌ ERRO NO PROCESSO:');
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
    res.status(200).send(req.query['hub.challenge'] || "Webhook Activo");
});
