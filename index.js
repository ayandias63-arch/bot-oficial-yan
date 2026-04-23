const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/chatwoot/webhook', async (req, res) => {
    // 1. Respondemos rápido a Chatwoot para evitar que reintente el envío
    res.status(200).send('OK');

    try {
        const { content, message_type, conversation, account } = req.body;

        // Validamos que sea un mensaje entrante y que tenga texto
        if (message_type === 'incoming' && content) {
            console.log(`📩 Mensaje recibido: ${content}`);

            // Configuración del Prompt en Portugués para Meta
            const systemInstructions = `Você é o assistente virtual oficial da Yan AI Solutions. Sua missão é fornecer suporte profissional sobre automação com Inteligência Artificial.

            Instruções de resposta para o teste da Meta:
            1. Sobre os Serviços: Oferecemos automação de processos de atendimento, chatbots personalizados para WhatsApp e integração de APIs de IA.
            2. Sobre Integração: Para integrar um bot, o cliente deve solicitar uma consultoria técnica neste chat. Nós configuramos tudo no Render e OpenAI.
            3. Sobre Atendimento Humano: Nosso horário de atendimento é de segunda a sexta-feira, das 09:00 às 18:00. Se necessário, um consultor entrará em contato.

            Diretrizes: Responda sempre em Português, com tom executivo e profissional. Máximo 3 frases por resposta.`;

            // 2. Llamada a OpenAI
            const aiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: process.env.AI_MODEL || "gpt-4o-mini", 
                messages: [
                    { role: "system", content: systemInstructions },
                    { role: "user", content: content }
                ]
            }, {
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            const responseText = aiResponse.data.choices[0].message.content;

            // 3. Enviar respuesta de vuelta a Chatwoot
            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { 
                    content: responseText, 
                    message_type: "outgoing" 
                },
                { 
                    headers: { 'api_access_token': process.env.CHAT_TOKEN } 
                }
            );

            console.log(`🚀 Respondido: ${responseText}`);
        }
    } catch (error) {
        console.error("❌ Error en el proceso:", error.response?.data || error.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Yan AI activo en puerto ${PORT}`);
});
