const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// --- FUNCIÓN PARA ACTIVAR EL PERMISO DE META ---
async function testMetaCall() {
    try {
        console.log("🔄 Intentando llamada de prueba a Meta...");
        const response = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${process.env.META_ACCESS_TOKEN}`);
        console.log("✅ Llamada a Meta exitosa. ID de la App:", response.data.id);
    } catch (error) {
        console.error("❌ Error en la llamada de prueba a Meta:", error.response?.data || error.message);
    }
}

app.post('/chatwoot/webhook', async (req, res) => {
    res.status(200).send('OK');

    try {
        const { content, message_type, conversation, account } = req.body;

        if (message_type === 'incoming' && content) {
            console.log(`📩 Mensaje recibido: ${content}`);

            const systemInstructions = `Você é o assistente virtual oficial da Yan AI Solutions. Sua missão é fornecer suporte profissional sobre automação com Inteligência Artificial.
            1. Serviços: Automação, chatbots WhatsApp e integração de APIs de IA.
            2. Integração: Solicitar consultoria técnica neste chat.
            3. Atendimento: Segunda a sexta, das 09:00 às 18:00.
            Responda sempre em Português, tom executivo. Máximo 3 frases.`;

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

            await axios.post(`${process.env.CHATWOOT_ENDPOINT}/api/v1/accounts/${account.id}/conversations/${conversation.id}/messages`,
                { content: responseText, message_type: "outgoing" },
                { headers: { 'api_access_token': process.env.CHAT_TOKEN } }
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
    // Ejecutamos la llamada a Meta justo al iniciar el servidor
    testMetaCall();
});
