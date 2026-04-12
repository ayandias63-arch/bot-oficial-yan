// Endpoint especial para Chatwoot
app.post('/api/v1/chatwoot', async (req, res) => {
  try {
    const { content, conversation, account, event } = req.body;

    // Solo respondemos si es un mensaje de un cliente (no del bot)
    if (event === "message_created" && req.body.message_type === "incoming") {
      
      const conversationId = conversation.id;
      const accountId = account.id;

      // Llamamos a Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(content);
      const aiResponse = result.response.text();

      // ENVIAR RESPUESTA DE VUELTA A CHATWOOT
      // Necesitarás tu TOKEN de Chatwoot en las variables de entorno de Render
      await fetch(`${process.env.CHATWOOT_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': process.env.CHATWOOT_TOKEN
        },
        body: JSON.stringify({
          content: aiResponse,
          message_type: "outgoing"
        })
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en Chatwoot Link:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});
