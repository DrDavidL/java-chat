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
    req.session.history = [];
  }

  // Add system prompt if it's the first message or it's a new system prompt
  if (req.session.history.length === 0 || (systemPrompt && req.session.history[0].content !== systemPrompt)) {
    req.session.history.unshift({ role: "system", content: systemPrompt });
  }

  // Add the user's message to the history
  req.session.history.push({ role: "user", content: message });

  try {
    const stream = await openai.chat.completions.create({
      messages: req.session.history as OpenAI.Chat.ChatCompletionMessageParam[], // Type casting
      model: "gpt-4",
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
    req.session.isAuthenticated = true;  // Mark the session as authenticated
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Middleware to check if the user is authenticated
function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

// Apply the middleware to all routes that need authentication
app.use('/chat', isAuthenticated);
app.use('/index.html', isAuthenticated);
app.use('/', (req, res, next) => {
  if (req.url === '/password.html' || req.url === '/verify-password') {
    next();
  } else {
    isAuthenticated(req, res, next);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
