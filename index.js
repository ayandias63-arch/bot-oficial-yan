const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

// Evita respuestas dobles
const processedMessages = new Set();

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type, id } = req.body;

    // Respuesta inmediata para que Chatwoot no reintente
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
                    content: `Você é um vendedor especialista em automação de WhatsApp com IA da YAN AI Solutions.
                    
                    OBJETIVO: Vender serviços que ajudam empresas a responder 24/7, não perder vendas e economizar tempo.
                    
                    REGRAS CRÍTICAS:
                    1. Responda SEMPRE em português do Brasil.
                    2. Mensagens curtas, naturais e humanas. NUNCA dê respostas longas.
                    3. Seja direto e persuasivo. Foco em RESULTADOS (vender mais, menos trabalho), não em tecnologia.
                    4. Sempre termine com uma pergunta para avançar a venda.
                    
                    GUIA DE ABORDAGEM:
                    - Primeiro contato: Pergunte se já perdem clientes por demora.
                    - Interesse: Explique que a IA vende enquanto eles dormem.
                    - Preço: Diga que o investimento se paga no primeiro mês e pergunte o volume de mensagens.
                    - Fechamento: Ofereça ativar hoje ou uma demonstração rápida.
                    
                    EXEMPLO DE TOM: "Você vai responder seus clientes automaticamente e vender até dormindo. Hoje você atende manualmente?"` 
                },
                { role: "user", content: content }
            ],
            max_tokens: 150,
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

    } catch (e) {
        console.log("❌ Erro no Agente de Vendas:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 VENDEDOR_YAN_ATIVADO'));
