const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// RUTA PARA TIDIO
app.post('/tidio', async (req, res) => {
    try {
        // Tidio envía el mensaje del usuario en req.body.message
        const userMessage = req.body.message;
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(userMessage);
        const aiResponse = result.response.text();

        // Tidio espera una respuesta en formato JSON con la propiedad 'reply'
        res.status(200).json({
            reply: aiResponse
        });
    } catch (error) {
        res.status(500).json({ reply: "Lo siento, tuve un problema técnico." });
    }
});

app.listen(10000, () => console.log("IA lista para Tidio en puerto 10000"));
