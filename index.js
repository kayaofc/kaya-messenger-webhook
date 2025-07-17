const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Ortam değişkenlerinden değerleri alıyoruz
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'kaya123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook doğrulandı!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging?.sender?.id;
    const messageText = messaging?.message?.text;

    if (senderId && messageText) {
      // OpenAI ChatGPT API’ye istek
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

      // Meta Messenger’a cevap gönder
      await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
          recipient: { id: senderId },
          message: { text: reply },
        }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook işleme hatası:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
