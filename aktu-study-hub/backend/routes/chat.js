const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT = `You are a study assistant for AKTU (Dr. A.P.J. Abdul Kalam Technical University) engineering students.
Explain concepts clearly and simply, use short examples relevant to their syllabus where possible, and show step-by-step
reasoning for numerical/derivation questions. If you don't know something, say so plainly instead of guessing.`;

async function askGemini(history, message) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const contents = [
    ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a reply — try rephrasing?";
}

async function askOpenAI(history, message) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "I couldn't generate a reply — try rephrasing?";
}

router.post('/', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const history = db.prepare(
    'SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 10'
  ).all(req.user.id).reverse();

  try {
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const reply = provider === 'openai'
      ? await askOpenAI(history, message)
      : await askGemini(history, message);

    db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'user', message);
    db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', reply);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'The AI service is unavailable right now. Check your API key and try again.' });
  }
});

router.get('/history', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY id ASC'
  ).all(req.user.id);
  res.json(rows);
});

module.exports = router;
