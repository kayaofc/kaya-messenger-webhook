const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// VERIFY_TOKEN'ı ortam değişkeninden al, yoksa 'kaya123' kullan
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'kaya123';

app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Doğrulama isteği geldi: ', { mode, token, challenge });

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook doğrulandı!');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook doğrulama başarısız! Forbidden.');
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  console.log('Gelen mesaj:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
