const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

// Variables de entorno (Configuradas en Render)
const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

// Evita respuestas duplicadas
const processedMessages = new Set();

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type, id } = req.body;

    // Respuesta rápida para evitar que el servidor reintente
    res.sendStatus(200);

    if (event !== "message_created" || message_type !== "incoming") return;
    if (processedMessages.has(id)) return;

    processedMessages.add(id);
    setTimeout(() => processedMessages.delete(id), 30000);

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: `Você é o Yan, especialista em IA da YAN AI Solutions. Seu WhatsApp é focado em donos de empresas e gerentes. Sua missão é agendar reuniões.

                    DIRETRIZES DE ESTILO:
                    - Linguagem de "Dono para Dono": Direto, prático e sem frescuras.
                    - Mensagens Curtas: Máximo 20-30 palavras. 
                    - Use 1 emoji por mensagem para parecer humano (✅, 🚀, 📈).
                    - NUNCA use termos técnicos como API ou Python. Fale de LUCRO e TEMPO.

                    REGRAS DE OURO:
                    1. PERGUNTA ÚNICA: Nunca faça duas perguntas no mesmo texto.
                    2. DIAGNÓSTICO: Antes de vender, pergunte: "Hoje você atende quantos clientes por dia no Whats?"
                    3. PREÇOS (Se o cliente insistir): 
                       - Planos baseados no volume para ser justo.
                       - Pequenos (10-50 atend/dia): R$ 97 a R$ 190.
                       - Médios (50-300 atend/dia): R$ 297 a R$ 997.
                       - Grandes (+300 atend/dia): R$ 997 a R$ 3.000+.
                       - Após dar o preço, pergunte o volume dele.

                    AGENDAMENTO:
                    - Sempre dê duas opções: "Conseguimos falar amanhã às 10h ou às 15h?"` 
                },
                { role: "user", content: content }
            ],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        // Enviar respuesta a Chatwoot
        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

        console.log("✅ Yan respondeu");

    } catch (e) {
        console.log("❌ Erro no Yan:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 AGENTE_YAN_VENDAS_ATIVO'));
