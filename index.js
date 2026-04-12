const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD ---
app.use(helmet()); // Protege contra ataques web comunes
app.use(cors());   // Permite que otras webs se conecten (puedes limitarlo después)
app.use(morgan('dev')); // Registro de actividad en consola
app.use(express.json()); // Para entender datos JSON

// Inicialización de Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// --- RUTAS ---

// 1. Health Check (Vital para Render y empresas)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor operativo' });
});

// 2. Chat Endpoint Profesional
app.post('/api/v1/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El campo "prompt" es obligatorio' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generación de contenido
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        respuesta: text
      }
    });

  } catch (error) {
    console.error('Error en Gemini:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar la IA'
    });
  }
});

// --- LANZAMIENTO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Profesional ejecutándose en puerto ${PORT}`);
});
