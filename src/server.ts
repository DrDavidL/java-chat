import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
      prompt: message,
      max_tokens: 150,
      n: 1,
      stop: null,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
      },
    });

    const botMessage = response.data.choices[0].text.trim();
    res.json({ message: botMessage });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
