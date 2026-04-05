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
        // 1. BUSCAR HISTÓRICO COMPLETO PARA TER MEMÓRIA
        const historyRes = await axios.get(
            `${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { headers: { 'api_access_token': CHATWOOT_TOKEN } }
        );

        const allMessages = historyRes.data.payload || [];
        const botMessages = allMessages.filter(m => m.message_type === "outgoing");
        const isFirstContact = botMessages.length === 0;

        // Mapeia os últimos 10 mensagens para o Groq entender o contexto
        const historyForAI = allMessages.slice(-10).map(m => ({
            role: m.message_type === "incoming" ? "user" : "assistant",
            content: m.content || ""
        }));

        // 2. CONFIGURAÇÃO DO VENDEDOR COM O SEU PROMPT
        const systemPrompt = `Você é um vendedor especialista em automação de WhatsApp da YAN AI Solutions.
        
        OBJETIVO: Vender serviços que ajudam empresas a responder 24/7 e não perder vendas.
        
        REGRAS DE OURO:
        - Responda SEMPRE em português do Brasil.
        - Mensagens curtas (máximo 2 parágrafos, 8-9 linhas no total).
        - NÃO fale de tecnologia, fale de RESULTADOS (vender mais, menos trabalho).
        - ${isFirstContact ? 'PRIMEIRA MENSAGEM: Use "Olá! Você já perde clientes por não responder rápido no WhatsApp?"' : 'JÁ CONVERSANDO: PROIBIDO saudações como "Olá", "Opa" ou "Tudo bem". Vá direto ao ponto usando o histórico.'}
        - Sempre termine com uma pergunta para avançar a venda.

        GUIA DE ARGUMENTOS:
        - Se mostrar interesse: "Perfeito 👌 a IA responde na hora. Hoje você atende manualmente?"
        - Se pedir preço: "Depende da necessidade, mas o investimento se paga no primeiro mês. Quantas mensagens você recebe por dia?"
        - Fechamento: "Posso ativar hoje. Quer começar agora ou ver uma demonstração rápida?"
        - Se duvidar: "Entendo 👍 mas quantos clientes você já perdeu por demora?"`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...historyForAI
            ],
            temperature: 0.5, // Mantém o bot focado e obediente
            max_tokens: 350
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });

        const aiReply = response.data.choices[0].message.content;

        // 3. ENVIAR RESPOSTA PARA O CHATWOOT
        await axios.post(`${CHATWOOT_ENDPOINT}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation.id}/messages`,
            { content: aiReply, message_type: "outgoing" },
            { headers: { 'api_access_token': CHATWOOT_TOKEN, 'Content-Type': 'application/json' } }
        );

    } catch (e) {
        console.log("❌ Erro no Vendedor Yan:", e.message);
    }
});

app.listen(process.env.PORT || 10000, () => console.log('🚀 VENDEDOR_YAN_V8_MEMORIA_FULL'));
