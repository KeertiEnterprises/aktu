require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const chatRoutes = require('./routes/chat');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('replace_this')) {
  console.error('\n[FATAL] Set a real JWT_SECRET in backend/.env before starting the server.\n');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// Basic abuse protection on auth + chat endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

// Serve the frontend (static files) from the same server.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AKTU Study Hub backend running at http://localhost:${PORT}`);
});
