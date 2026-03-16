import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

/* CONFIG */

const VERIFY_TOKEN = "yanbot123";
const WHATSAPP_TOKEN = "EAAM68BojJm4BQ9CTEcRsnP7kleqxhm8tA2vssroFTVmfJKWyafBTyo64cnhobIYwsm78809XX6RRGxfZC9AC7L9k44Q5yM21fjJs9hPZAPjXhozBLQeI88Kg1DCO2saGCB6QwVXbJvhM7LZAcCSUsHiXrdZBAnZBZBZBQ6hUhjO6ZCRokudr20sebBDkapBaOaYXStZAhdzQq1Bhey5f1MvvtCRk0XbRtZA46e1oLMRkBKbZCxMSTJrdVUEA284qq7le0qV1dZABu2IXhSltZBOi2oHP8";
const PHONE_NUMBER_ID = "5180509297";
const GEMINI_API_KEY = "AIzaSyAPL33oHMcdf_qKPEiBvyM-7p7otsbG080";

/* GEMINI */

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function preguntarGemini(texto) {

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const result = await model.generateContent(texto);
  const response = await result.response;

  return response.text();
}

/* VERIFICAR WEBHOOK */

app.get("/webhook", (req, res) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }

});

/* RECIBIR MENSAJES */

app.post("/webhook", async (req, res) => {

  try {

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {

      const from = message.from;
      const text = message.text?.body;

      console.log("Mensaje:", text);

      const respuestaIA = await preguntarGemini(text);

      await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: respuestaIA }
        })
      });

    }

    res.sendStatus(200);

  } catch (error) {

    console.error(error);
    res.sendStatus(500);

  }

});

/* SERVIDOR */

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
