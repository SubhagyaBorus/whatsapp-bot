const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 YOUR CONFIG
const VERIFY_TOKEN = "mytoken123";
const WHATSAPP_TOKEN = "EAAhWa8aFjp4BREUcubbNNbMIsnI1AhJl85ed93eoxgTC7yYpQXSF1wwMm6VWrLfc7GBSAc3Q8sybkQEa3rXx1WrHglh4060u6s73UBsZBFVQzEVXibwM9pVO48jjBvRHMfSUxT5PnpbvsV3WFb793E9oDyCzpP4ZAgc885YKaytZBIJiJkG3Et6ZBBtHO4YQt08wUhpdXXQtWT9VVg2qA81VSwdcxnKrTE8phARQ9BCfm34Qc6GyT25vq9AxUTN5ZC2FObBPr6OjzEG5aMtMOvyfBtKQZD";
const PHONE_NUMBER_ID = "1057295160801843";
const MISTRAL_API_KEY = "ZreBzUwSugnwehUYV3keOjJS6cPXeJup";

// ✅ 1. Webhook verification (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ✅ 2. Receive message (POST)
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageObj = value?.messages?.[0];

    if (!messageObj) return res.sendStatus(200);

    const userMessage = messageObj.text?.body;
    const from = messageObj.from;

    console.log("User:", userMessage);

    // 🤖 Call Mistral AI
    const aiResponse = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      aiResponse.data.choices[0].message.content || "Sorry, no response";

    console.log("Bot:", reply);

    // 📩 Send reply to WhatsApp
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.log("Error:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

// 🚀 Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});