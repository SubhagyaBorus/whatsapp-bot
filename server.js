const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 YOUR CONFIG
const VERIFY_TOKEN = "mytoken123";
const WHATSAPP_TOKEN = "EAAhWa8aFjp4BRPjOKP0QdGKF1weB1xJ9V1a44T4tMFjcv1XFXZBaZBli1knTLHsh2Gl8HZAalqWJMXxf4E0iretSdZBDHl0NPTpgXXbaak51ndXFUfLkZAHQuJlOaGatL7XSzHh4Yl4DKlEl5yng3tcHvgZBLYtHtSs0RJ8f56ND2iclArmfVj4PKZCgd6cX8kCNQZDZD";
const PHONE_NUMBER_ID = "1058478520688868";
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

    let reply = "";

    // 🔥 MENU SYSTEM
    if (!userMessage) {
      return res.sendStatus(200);
    }

    const msg = userMessage.toLowerCase();

    if (msg === "hi" || msg === "hello") {
      reply = `Hey 👋 Welcome to AiChatBot Services 🚀

We offer:
1️⃣ Mobile App Development 📱  
2️⃣ Website Development 🌐  
3️⃣ AI Chatbots 🤖  
4️⃣ UI/UX Design 🎨  
5️⃣ Video Editing 🎬  

👉 Type a number to know more
👉 Or ask anything 😊`;
    }

    else if (msg === "1") {
      reply = `📱 Mobile App Development

✔ Android & iOS apps  
✔ Flutter apps  
✔ Backend APIs  

💰 Starting from ₹10,000  

Interested? Reply YES 👍`;
    }

    else if (msg === "2") {
      reply = `🌐 Website Development

✔ Business websites  
✔ E-commerce  
✔ Admin panels  

💰 Starting from ₹5,000  

Interested? Reply YES 👍`;
    }

    else if (msg === "3") {
      reply = `🤖 AI Chatbot Services

✔ WhatsApp bots  
✔ Website bots  
✔ Automation  

💰 Starting from ₹8,000  

Interested? Reply YES 👍`;
    }

    else if (msg === "4") {
      reply = `🎨 UI/UX Design

✔ App UI  
✔ Website UI  
✔ Figma designs  

💰 Starting from ₹3,000  

Interested? Reply YES 👍`;
    }

    else if (msg === "5") {
      reply = `🎬 Video Editing

✔ Reels & Shorts  
✔ YouTube videos  
✔ Ads  

💰 Starting from ₹1,000  

Interested? Reply YES 👍`;
    }

    else if (msg === "yes") {
      reply = `Great! 🎉

Please share:
📛 Your Name  
📱 Your Requirement  

Our team will contact you soon 😊`;
    }

    else {
      // 🤖 AI fallback (SMART SELLING)
      const aiResponse = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: "mistral-small",
          messages: [
            {
              role: "system",
              content:
                "You are a smart business assistant selling services like mobile apps, websites, AI chatbots, UI design, and video editing. Always try to convert user into a client."
            },
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

      reply =
        aiResponse.data.choices[0].message.content ||
        "Sorry, I didn’t understand.";
    }

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

