const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Ortam değişkenleri
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'kaya123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// GET /webhook → Meta doğrulama için
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook doğrulandı!');
    res.status(200).send(challenge);
  } else {
    console.warn('❌ Webhook doğrulama başarısız.');
    res.sendStatus(403);
  }
});

// POST /webhook → Mesaj geldiğinde çalışır
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const event = entry.messaging?.[0];
        const senderId = event?.sender?.id;
        const messageText = event?.message?.text;

        if (senderId && messageText) {
          console.log(`📩 Gelen mesaj: "${messageText}"`);

          // OpenAI yanıtı al
          const aiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: 'Sen bir müşteri destek botusun.' },
                { role: 'user', content: messageText }
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const reply = aiResponse.data.choices?.[0]?.message?.content || 'Üzgünüm, şu anda cevap veremiyorum.';

          // Messenger’a cevap gönder
          await axios.post(
            `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
              recipient: { id: senderId },
              message: { text: reply },
            }
          );

          console.log(`📤 Yanıt gönderildi: "${reply}"`);
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Webhook işleme hatası:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
