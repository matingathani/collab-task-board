const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.username as created_by_username FROM tasks t LEFT JOIN users u ON t.created_by = u.id ORDER BY t.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, priority, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || '', status || 'todo', priority || 'medium', req.user.userId]
    );

    const task = result.rows[0];

    if (ioInstance) {
      ioInstance.emit('task:created', task);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const current = existing.rows[0];
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [
        title ?? current.title,
        description ?? current.description,
        status ?? current.status,
        priority ?? current.priority,
        id
      ]
    );

    const task = result.rows[0];

    if (ioInstance) {
      ioInstance.emit('task:updated', task);
    }

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    if (ioInstance) {
      ioInstance.emit('task:deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, setIo };
