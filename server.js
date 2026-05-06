const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =============================
// 🔐 CONFIG
// =============================
const VERIFY_TOKEN = "mytoken123";
const WHATSAPP_TOKEN = "EAAhWa8aFjp4BRUZC6xUoumHV5cpBnRlfoTalLpTgkvH2XC0r5IXBh0w22OeTYoHZBCO5z56WD9sOUtwAaMfVP6maxJVCsdtOy67EEzpuyAyg7fVoDxXQFkC69E7eEXVX9GyjZBubN3NwssVkYMu8I856w8v1ZBNvrUJmG0bRq6N2FziYpROpEaCAadDu8FrBQcE7YqfqLdf8sDc9DUDlrKixWM7SuWmo4u9oMhQ4fNuRwFDsMQZBoUcxWNC6ZCXpxP8LZARGwSdIZCZCGRxBFyw8Hr4eTWPWrIfDILwZDZD";
const PHONE_NUMBER_ID = "1057295160801843";
const MISTRAL_API_KEY = "ZreBzUwSugnwehUYV3keOjJS6cPXeJup";

// 📊 GOOGLE SHEET (Apps Script URL)
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzaT8oyZisRMMgc7ENjNZXXPauRCQRzxkwmD7eQKbihodG9Ux-QZ2JKgJNU4sAWlCgZ/exec";

// 📲 OWNER NUMBER
const OWNER_NUMBER = "917888344612";

// =============================
// 🧠 SESSION STORAGE
// =============================
const sessions = {};

// =============================
// ✅ VERIFY WEBHOOK
// =============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// =============================
// 📩 SEND MESSAGE
// =============================
async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// =============================
// 📊 SAVE TO SHEET (FIXED)
// =============================
async function saveToSheet(data) {
  try {
    await axios.post(SHEET_WEBHOOK_URL, {
      name: data.name,
      phone: data.phone,
      email: data.email,
      treatment: data.treatment,
      concern: data.concern,
    });

    console.log("✅ Saved to Google Sheet");
  } catch (error) {
    console.error("❌ Sheet Error:", error.message);
  }
}

// =============================
// 📲 NOTIFY OWNER
// =============================
async function notifyOwner(data) {
  const message = `🔥 New Booking

👤 Name: ${data.name}
📞 Phone: ${data.phone}
📧 Email: ${data.email}
💆 Treatment: ${data.treatment}
📝 Concern: ${data.concern}`;

  await sendMessage(OWNER_NUMBER, message);
}

// =============================
// 🤖 AI FUNCTION (IMPROVED)
// =============================
async function askAI(message) {
  try {
    const res = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-small",
        messages: [
          {
            role: "system",
            content: `
You are a smart assistant for Lumina Laser Beauty clinic.

Services:
- Laser Hair Removal
- HIFU Skin Tightening
- Acne / Pigmentation
- Hair Regrowth

Rules:
- Keep answers short
- Be friendly
- Guide user to book consultation
            `,
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (e) {
    return "Sorry, I couldn't understand that.";
  }
}

// =============================
// 🚀 MAIN WEBHOOK
// =============================
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK:", JSON.stringify(req.body, null, 2));

    const messageObj =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!messageObj) {
      console.log("⚠️ No message received");
      return res.sendStatus(200);
    }

    const from = messageObj.from;
    const userText = messageObj.text?.body?.trim();

    console.log("📩 From:", from);
    console.log("💬 Message:", userText);

    if (!userText) return res.sendStatus(200);

    // =============================
    // SESSION INIT
    // =============================
    if (!sessions[from]) {
      sessions[from] = { step: "start" };
    }

    const user = sessions[from];
    let reply = "";

    // =============================
    // FLOW
    // =============================

    if (user.step === "start") {
      reply =
        "Hi 👋 I'm Lumina Assistant.\n\nWe offer FREE consultation.\n\nChoose:\n1️⃣ Services\n2️⃣ Book Consultation\n3️⃣ Pricing\n4️⃣ Location";
      user.step = "menu";
    }

    else if (user.step === "menu") {
      if (userText === "1") {
        reply =
          "✨ Services:\n\n• Laser Hair Removal\n• HIFU\n• Acne / Pigmentation\n• Hair Regrowth\n\nReply 2 to book.";
      } 
      else if (userText === "2") {
        reply = "Great! Let's book your FREE consultation 😊\n\nWhat's your name?";
        user.step = "name";
      } 
      else if (userText === "3") {
        reply = "Pricing varies. Book FREE consultation.\n\nReply 2 to book.";
      } 
      else if (userText === "4") {
        reply = "📍 Amritsar\n📞 +91 9056978703\n⏰ 10AM - 7PM";
      } 
      else {
        reply = await askAI(userText);
      }
    }

    else if (user.step === "name") {
      user.name = userText;
      reply = `Nice to meet you, ${user.name} 😊\n\nEnter your phone:`;
      user.step = "phone";
    }

    else if (user.step === "phone") {
      user.phone = userText;
      reply = "Enter email (or type skip):";
      user.step = "email";
    }

    else if (user.step === "email") {
      user.email =
        userText.toLowerCase() === "skip" ? "Not provided" : userText;

      reply = "Choose treatment:\n1. Laser\n2. HIFU\n3. Acne\n4. Hair";
      user.step = "treatment";
    }

    else if (user.step === "treatment") {
      const map = {
        "1": "Laser Hair Removal",
        "2": "HIFU",
        "3": "Acne",
        "4": "Hair Regrowth",
      };

      user.treatment = map[userText] || userText;
      reply = "Any concern? (or skip)";
      user.step = "concern";
    }

    else if (user.step === "concern") {
      user.concern =
        userText.toLowerCase() === "skip" ? "None" : userText;

      await saveToSheet(user);
      await notifyOwner(user);

      reply = "✅ Done! We’ll call you within 2 hours.";

      delete sessions[from];
    }

    else {
      reply = await askAI(userText);
    }

    console.log("🤖 Reply:", reply);

    // =============================
    // SEND MESSAGE
    // =============================
    await sendMessage(from, reply);

    res.sendStatus(200);

  } catch (error) {
    console.error("❌ ERROR:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

// =============================
app.listen(3000, () => {
  console.log("🚀 Server running");
});