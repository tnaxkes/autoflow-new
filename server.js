const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function buildLeadMessage(data) {
  const lines = [
    'New lead',
    `Source: ${data.source || '-'}`,
    `Name: ${data.name || '-'}`,
    `Contact: ${data.contact || '-'}`,
    `Task type: ${data.taskType || '-'}`,
    `Message: ${data.message || '-'}`,
    `Leads: ${data.leads || '-'}`,
    `Check: ${data.check || '-'}`,
    `Conversion: ${data.conversion || '-'}`,
    `Answers: ${data.answers || '-'}`
  ];

  return lines.join('\n');
}

async function sendTelegramMessage(text) {
  const token = requiredEnv('BOT_TOKEN');
  const chatId = requiredEnv('CHAT_ID');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API error: ${response.status} ${body}`);
  }
}

app.get('/', function (_req, res) {
  res.json({ ok: true, service: 'flowbyte-telegram-webhook' });
});

app.get('/health', function (_req, res) {
  res.json({ ok: true });
});

app.post('/webhook/lead', upload.none(), async function (req, res) {
  try {
    const payload = req.body || {};
    const text = buildLeadMessage(payload);

    await sendTelegramMessage(text);

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Server listening on port ${port}`);
});
