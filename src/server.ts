import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import session from 'express-session';
// Remove this line
// import './types/express-session'; 

dotenv.config();  // Load environment variables from .env file

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
  const { message } = req.body;

  if (!req.session.history) {
    req.session.history = [
      { role: "system", content: "You are a helpful assistant." }
    ];
  }

  // Add the user's message to the history
  req.session.history.push({ role: "user", content: message });

  try {
    const completion = await openai.chat.completions.create({
      messages: req.session.history as OpenAI.Chat.ChatCompletionMessageParam[], // Type casting
      model: "gpt-4"
    });

    const botMessage = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content
      ? completion.choices[0].message.content.trim()
      : "No response from the assistant.";

    // Add the assistant's response to the history
    req.session.history.push({ role: "assistant", content: botMessage });

    res.json({ message: botMessage });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
