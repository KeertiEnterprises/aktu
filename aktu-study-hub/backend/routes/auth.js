const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// NOTE ON DESIGN: users create a password FOR THIS SITE. We store only a
// bcrypt hash of it — never the plaintext, and we never ask for or touch
// anyone's real Gmail password. Their email field is just a contact/identity
// field, same as any signup form.

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are all required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'That username or email is already registered.' });
  }

  const hash = bcrypt.hashSync(password, 12);
  const info = db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(username, email, hash, 'student');

  const user = { id: info.lastInsertRowid, username, role: 'student' };
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, username, email, role: user.role } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const row = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(username, username);

  // Same generic error whether the user doesn't exist or the password is
  // wrong — don't reveal which, so accounts can't be enumerated.
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const token = signToken(row);
  res.json({
    token,
    user: { id: row.id, username: row.username, email: row.email, role: row.role },
  });
});

module.exports = router;
