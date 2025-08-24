const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { runMigrations, query } = require('./db');
const cache = require('./cache');

const app = express();

const PORT = process.env.PORT || 3000;
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '10', 10);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    await cache.ping();
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Helpers
const TODOS_CACHE_KEY = 'todos:all';
async function invalidateTodosCache() {
  try {
    await cache.del(TODOS_CACHE_KEY);
  } catch (_) {
    // best effort
  }
}

app.get('/api/todos', async (req, res) => {
  try {
    const cached = await cache.get(TODOS_CACHE_KEY);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const { rows } = await query(
      'SELECT id, title, completed, created_at FROM todos ORDER BY id DESC'
    );
    await cache.setEx(TODOS_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(rows));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos', details: err.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const { rows } = await query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed, created_at',
      [title]
    );
    await invalidateTodosCache();
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo', details: err.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (typeof req.body.title === 'string') {
      fields.push(`title = $${idx++}`);
      values.push(req.body.title.trim());
    }
    if (typeof req.body.completed === 'boolean') {
      fields.push(`completed = $${idx++}`);
      values.push(req.body.completed);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    values.push(id);
    const sql = `UPDATE todos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, title, completed, created_at`;
    const { rows } = await query(sql, values);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }
    await invalidateTodosCache();
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo', details: err.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    await query('DELETE FROM todos WHERE id = $1', [id]);
    await invalidateTodosCache();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo', details: err.message });
  }
});

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});


