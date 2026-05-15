require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const qrcode = require("qrcode-terminal");

const { Client, LocalAuth } = require("whatsapp-web.js");

const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

/* ======================================================
   OPENAI
====================================================== */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ======================================================
   PROMPT SISTEMA
====================================================== */

const PROMPT_SISTEMA = `
Você é a Clara, assistente virtual inteligente de uma clínica médica brasileira.

Seu atendimento deve ser:
- profissional
- simpático
- rápido
- humanizado

Você ajuda pacientes com:
- agendamento de consultas
- informações médicas básicas
- horários
- especialidades
- convênios
- atendimento humano

Especialidades:
- Clínico Geral
- Dermatologista
- Cardiologista
- Pediatra
- Psicólogo
- Ortopedista
- Ginecologista

Regras:
- Responda curto e natural.
- Não envie textos enormes.
- Faça uma pergunta por vez.
- Use poucos emojis.
- Nunca diga que é IA.
- Sempre tente ajudar o paciente.

Se o paciente pedir humano:
"Claro 😊 Vou encaminhar você para nossa equipe."
`;

/* ======================================================
   WHATSAPP
====================================================== */

const client = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    headless: true,

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  },
});

/* ======================================================
   QR CODE
====================================================== */

client.on("qr", (qr) => {
  console.log("\n📲 ESCANEIE O QR CODE:\n");

  qrcode.generate(qr, {
    small: true,
  });
});

/* ======================================================
   CONECTADO
====================================================== */

client.on("ready", () => {
  console.log("✅ Bot conectado!");
});

/* ======================================================
   MEMÓRIA
====================================================== */

const conversas = {};

/* ======================================================
   MENSAGENS
====================================================== */

client.on("message", async (message) => {
  try {
    // Ignorar grupos
    if (message.from.includes("@g.us")) return;

    // Criar memória
    if (!conversas[message.from]) {
      conversas[message.from] = [];
    }

    let textoUsuario = message.body;

    /* ======================================================
       PROCESSAR ÁUDIO
    ====================================================== */

    if (message.hasMedia) {
      const media = await message.downloadMedia();

      if (
        media &&
        media.mimetype &&
        media.mimetype.includes("audio")
      ) {
        console.log("🎤 Áudio recebido");

        // salvar áudio
        fs.writeFileSync(
          "audio.ogg",
          Buffer.from(media.data, "base64")
        );

        // transcrição
        const transcricao =
          await openai.audio.transcriptions.create({
            file: fs.createReadStream("audio.ogg"),
            model: "whisper-1",
          });

        textoUsuario = transcricao.text;

        console.log("📝 Transcrição:");
        console.log(textoUsuario);
      }
    }

    // Ignorar vazio
    if (!textoUsuario) return;

    console.log("\n📩 Mensagem:");
    console.log(textoUsuario);

    /* ======================================================
       HISTÓRICO
    ====================================================== */

    conversas[message.from].push({
      role: "user",
      content: textoUsuario,
    });

    // limitar memória
    conversas[message.from] =
      conversas[message.from].slice(-15);

    /* ======================================================
       OPENAI
    ====================================================== */

    const respostaIA =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        temperature: 0.7,

        messages: [
          {
            role: "system",
            content: PROMPT_SISTEMA,
          },

          ...conversas[message.from],
        ],
      });

    const resposta =
      respostaIA.choices[0].message.content;

    console.log("\n🤖 Resposta:");
    console.log(resposta);

    /* ======================================================
       SALVAR RESPOSTA
    ====================================================== */

    conversas[message.from].push({
      role: "assistant",
      content: resposta,
    });

    /* ======================================================
       DIGITANDO
    ====================================================== */

    const chat = await message.getChat();

    await chat.sendStateTyping();

    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    /* ======================================================
       ENVIAR
    ====================================================== */

    await client.sendMessage(
      message.from,
      resposta
    );
  } catch (erro) {
    console.log("❌ ERRO:");
    console.log(erro);

    await client.sendMessage(
      message.from,
      "Desculpe, ocorreu um erro no atendimento."
    );
  }
});

/* ======================================================
   API
====================================================== */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    bot: "Clínica IA",
  });
});

/* ======================================================
   SERVIDOR
====================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor rodando na porta ${PORT}`
  );
});

/* ======================================================
   INICIAR BOT
====================================================== */

client.initialize();
