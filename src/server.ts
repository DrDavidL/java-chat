import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import session from 'express-session';

config();  // Load environment variables from .env file

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

app.use(bodyParser.json());

// Initialize session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set to true if using HTTPS
}));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/chat', async (req, res) => {
  const { message, systemPrompt } = req.body;

  if (!req.session.history) {
    req.session.history = [
      { role: "system", content: systemPrompt }
    ];
  } else if (systemPrompt.startsWith("This system prompt overrides the prior system prompt for messages after this point")) {
    req.session.history.push({ role: "system", content: systemPrompt });
  }

  // Add the user's message to the history
  req.session.history.push({ role: "user", content: message });

  // Send only the last user message and relevant context to the API
  const messagesToSend = [
    ...req.session.history.slice(-2) // Last two messages: latest system prompt (if any) and user message
  ];

  try {
    const stream = await openai.chat.completions.create({
      messages: messagesToSend as OpenAI.Chat.ChatCompletionMessageParam[], // Type casting
      model: "gpt-4o",
      stream: true
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    let botMessage = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(content);
      botMessage += content;
    }
    res.end();

    // Add the assistant's response to the history
    req.session.history.push({ role: "assistant", content: botMessage });

  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Add password verification endpoint
app.post('/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === process.env.PASSWORD_SECRET) {
    if (req.session) req.session.isAuthenticated = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
