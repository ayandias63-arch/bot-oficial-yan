const express = require('express');
const axios = require('axios');
const app = express().use(express.json());

const GROQ_KEY = process.env.GROQ_API_KEY;
const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_ENDPOINT = process.env.CHATWOOT_ENDPOINT;

const processedMessages = new Set();

app.post('/webhook', async (req, res) => {
    const { event, conversation, content, message_type, id } = req.body;

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
                    content: `Você é o Yan, especialista em IA da YAN AI Solutions. 
                    
                    ESTILO DE COMUNICAÇÃO (HUMANO):
                    - Fale como um dono de empresa brasileiro: use "Opa", "Tudo bem?", "Putz", "Com certeza", "Faz sentido".
                    - Evite listas chatas e textos robóticos. Use parágrafos curtos e quebras de linha.
                    - Mostre empatia. Se o cliente falar de um problema, diga: "Entendo bem como é, isso acontece muito mesmo."
                    
                    OBJETIVO:
                    Vender automação de WhatsApp. Foque em tirar o trabalho manual do cliente para ele focar no que importa.
                    
                    REGRAS DE OURO:
                    1. Nunca dê respostas de uma linha só (parece seco), mas não passe de 2 parágrafos.
                    2. SEMPRE termine com uma pergunta natural.
                    3. PREÇOS: Se perguntarem, explique que é baseado no volume para ser justo (R$ 97 a R$ 190 para pequenos, R$ 297 a R$ 997 médios). 
                    
                    EXEMPLO DE TOM:
                    "Opa, tudo certo? Cara, eu entendo perfeitamente. Atender todo mundo no dedo é uma correria e a gente acaba perdendo venda por demora. 😅 Com a nossa IA, o cliente é respondido na hora e você só assume quando ele já quer fechar. Hoje você sente que perde muita gente por não responder rápido?"` 
                },
                { role: "user", content: content }
            ],
            temperature: 0.85, // Mais criativo e menos robótico
            max_tokens: 300
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

        console.log("✅ Yan Humano respondeu");

    } catch (e) {
        console.log("❌ Erro:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 VENDEDOR_HUMANO_ON'));
