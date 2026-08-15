const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// This library is for content your group actually has the right to share:
// your own notes/PDFs, links to free public resources (NPTEL, YouTube,
// official AKTU material), or write-ups your friends create. It's not a
// place to re-host paid course videos you bought a personal license for —
// that would break the license and copyright law even if you don't charge
// anyone else for it.

router.get('/', requireAuth, (req, res) => {
  const { subject, semester } = req.query;
  let sql = 'SELECT r.*, u.username AS uploaded_by_name FROM resources r JOIN users u ON u.id = r.uploaded_by WHERE 1=1';
  const params = [];
  if (subject) { sql += ' AND r.subject = ?'; params.push(subject); }
  if (semester) { sql += ' AND r.semester = ?'; params.push(semester); }
  sql += ' ORDER BY r.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', requireAuth, (req, res) => {
  const { title, subject, semester, type, url_or_path, description } = req.body;
  if (!title || !subject || !semester || !type || !url_or_path) {
    return res.status(400).json({ error: 'Title, subject, semester, type, and a link/path are required.' });
  }
  if (!['note', 'link', 'file'].includes(type)) {
    return res.status(400).json({ error: "Type must be 'note', 'link', or 'file'." });
  }

  const info = db.prepare(`
    INSERT INTO resources (title, subject, semester, type, url_or_path, description, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, subject, semester, type, url_or_path, description || '', req.user.id);

  res.status(201).json({ id: info.lastInsertRowid });
});

router.delete('/:id', requireAuth, (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });
  if (resource.uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "You can only delete resources you uploaded." });
  }
  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
