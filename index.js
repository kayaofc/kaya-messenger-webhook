const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const VERIFY_TOKEN = 'kaya123'; // Meta'da kullanacağın verify token

app.use(bodyParser.json());

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

app.post('/webhook', (req, res) => {
  console.log('Gelen mesaj:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Render PORT için
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
