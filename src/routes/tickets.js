const express = require('express');
const router = express.Router();
const db = require('../db');

function withSlaStatus(ticket) {
    if (!ticket.sla_due_at || ticket.status === 'closed') {
        return { ...ticket, sla_status: 'n/a' };
    }
    const dueDate = new Date(ticket.sla_due_at);
    const now = new Date();
    const sla_status = now > dueDate ? 'breached' : 'on_track';
    return { ...ticket, sla_status };
}

// CREATE
router.post('/', (req, res) => {
    const { title, description, priority, category, assignee, sla_due_at } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'title is required' });
    }
    const stmt = db.prepare(`
    INSERT INTO tickets (title, description, priority, category, assignee, sla_due_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(title, description, priority || 'medium', category, assignee, sla_due_at);
    const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTicket);
});

// READ all
router.get('/', (req, res) => {
    const tickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all();
    res.json(tickets.map(withSlaStatus));
});

// READ one
router.get('/:id', (req, res) => {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'not found' });
    res.json(withSlaStatus(ticket));
});

// List only tickets currently breaching SLA
router.get('/status/breaches', (req, res) => {
    const tickets = db.prepare(`SELECT * FROM tickets WHERE status != 'closed'`).all();
    const breached = tickets.map(withSlaStatus).filter(t => t.sla_status === 'breached');
    res.json(breached);
});

// UPDATE
router.put('/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });

    const { title, description, status, priority, category, assignee, sla_due_at } = req.body;
    db.prepare(`
    UPDATE tickets
    SET title = ?, description = ?, status = ?, priority = ?, category = ?, assignee = ?, sla_due_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
        title ?? existing.title,
        description ?? existing.description,
        status ?? existing.status,
        priority ?? existing.priority,
        category ?? existing.category,
        assignee ?? existing.assignee,
        sla_due_at ?? existing.sla_due_at,
        req.params.id
    );
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// CLOSE (a specific, common ITSM action — separate from generic update)
router.post('/:id/close', (req, res) => {
    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    db.prepare(`UPDATE tickets SET status = 'closed', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json(updated);
});

// DELETE
router.delete('/:id', (req, res) => {
    const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'not found' });
    res.status(204).send();
});

module.exports = router;