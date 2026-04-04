const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type } = req.body;

    if (event === "message_created" && message_type === "incoming") {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `Você é o Yan, especialista em IA e vendas da YAN AI Solutions.
                        Seu objetivo é vender soluções de automação de WhatsApp e IA para empresas.
                        
                        DIRETRIZES DE ATUAÇÃO:
                        1. Seja profissional, persuasivo e focado em resultados (ROI).
                        2. Responda sempre em português.
                        3. Se o cliente perguntar o que fazemos: Explicamos que criamos atendentes inteligentes que vendem sozinhos 24h por dia.
                        4. Sempre tente levar o cliente a marcar uma reunião ou pedir um orçamento.
                        5. Mantenha as respostas curtas (máximo 3 parágrafos) para facilitar a leitura no WhatsApp.` 
                    },
                    { role: "user", content: content }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
            });

            const aiReply = response.data.choices[0].message.content;

            await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
                { content: aiReply, message_type: "outgoing" },
                { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
            );
            console.log("✅ Vendedor Yan respondeu");
        } catch (e) {
            console.log("❌ Erro no Vendedor:", e.message);
        }
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 AGENTE_VENDAS_YAN_ON'));
