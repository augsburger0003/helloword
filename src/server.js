require('dotenv').config();

const path = require('path');
const express = require('express');
const { all, get, run, now, initializeDatabase } = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedPriorities = new Set(['high', 'medium', 'low']);
const allowedStatuses = new Set(['todo', 'in_progress', 'done']);

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function cleanText(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

async function categories() {
  return all('SELECT id, name, color FROM categories ORDER BY name');
}

async function taskById(id) {
  return get(
    `SELECT t.id, t.title, t.description, t.category_id AS categoryId, c.name AS category,
      c.color AS categoryColor, t.priority, t.status, t.due_date AS dueDate, t.owner,
      t.created_at AS createdAt, t.updated_at AS updatedAt
     FROM tasks t JOIN categories c ON c.id = t.category_id WHERE t.id = ?`,
    [id]
  );
}

app.get('/api/dashboard', async (request, response, next) => {
  try {
    const [taskRows, categoryRows, activity] = await Promise.all([
      all(`SELECT t.id, t.title, t.description, t.category_id AS categoryId, c.name AS category,
        c.color AS categoryColor, t.priority, t.status, t.due_date AS dueDate, t.owner,
        t.created_at AS createdAt, t.updated_at AS updatedAt
        FROM tasks t JOIN categories c ON c.id = t.category_id
        ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END,
          t.updated_at DESC`),
      categories(),
      all(`SELECT a.id, a.message, a.created_at AS createdAt, t.title AS taskTitle
        FROM activity a LEFT JOIN tasks t ON t.id = a.task_id
        ORDER BY a.created_at DESC, a.id DESC LIMIT 5`)
    ]);
    const completed = taskRows.filter((task) => task.status === 'done').length;
    const active = taskRows.filter((task) => task.status === 'in_progress').length;
    response.json({
      metrics: {
        total: taskRows.length,
        completed,
        active,
        completionRate: taskRows.length ? Math.round((completed / taskRows.length) * 100) : 0
      },
      tasks: taskRows,
      categories: categoryRows,
      activity
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tasks', async (request, response, next) => {
  try {
    const filters = [];
    const values = [];
    if (allowedStatuses.has(request.query.status)) {
      filters.push('t.status = ?');
      values.push(request.query.status);
    }
    if (cleanText(request.query.category, 40)) {
      filters.push('t.category_id = ?');
      values.push(cleanText(request.query.category, 40));
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const tasks = await all(
      `SELECT t.id, t.title, t.description, t.category_id AS categoryId, c.name AS category,
        c.color AS categoryColor, t.priority, t.status, t.due_date AS dueDate, t.owner,
        t.created_at AS createdAt, t.updated_at AS updatedAt
       FROM tasks t JOIN categories c ON c.id = t.category_id ${where}
       ORDER BY t.updated_at DESC`,
      values
    );
    response.json({ tasks });
  } catch (error) {
    next(error);
  }
});

app.get('/api/categories', async (request, response, next) => {
  try {
    response.json({ categories: await categories() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/tasks', async (request, response, next) => {
  try {
    const title = cleanText(request.body.title, 140);
    const categoryId = cleanText(request.body.categoryId, 40);
    if (!title || !categoryId) {
      return response.status(400).json({ error: 'Title and category are required.' });
    }
    if (!await get('SELECT id FROM categories WHERE id = ?', [categoryId])) {
      return response.status(400).json({ error: 'Choose an existing category.' });
    }
    const priority = allowedPriorities.has(request.body.priority) ? request.body.priority : 'medium';
    const status = allowedStatuses.has(request.body.status) ? request.body.status : 'todo';
    const timestamp = now();
    const result = await run(
      `INSERT INTO tasks
       (title, description, category_id, priority, status, due_date, owner, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, cleanText(request.body.description), categoryId, priority, status,
        cleanText(request.body.dueDate, 10) || null, cleanText(request.body.owner, 80),
        timestamp, timestamp]
    );
    await run('INSERT INTO activity (task_id, message, created_at) VALUES (?, ?, ?)',
      [result.lastID, `Added “${title}”`, timestamp]);
    return response.status(201).json({ task: await taskById(result.lastID) });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/tasks/:id', async (request, response, next) => {
  try {
    const existing = await taskById(request.params.id);
    if (!existing) return response.status(404).json({ error: 'Task not found.' });
    const body = request.body;
    const title = body.title === undefined ? existing.title : cleanText(body.title, 140);
    const categoryId = body.categoryId === undefined ? existing.categoryId : cleanText(body.categoryId, 40);
    const priority = body.priority === undefined ? existing.priority : body.priority;
    const status = body.status === undefined ? existing.status : body.status;
    if (!title || !categoryId || !allowedPriorities.has(priority) || !allowedStatuses.has(status)) {
      return response.status(400).json({ error: 'The submitted task values are invalid.' });
    }
    if (!await get('SELECT id FROM categories WHERE id = ?', [categoryId])) {
      return response.status(400).json({ error: 'Choose an existing category.' });
    }
    const timestamp = now();
    await run(
      `UPDATE tasks SET title = ?, description = ?, category_id = ?, priority = ?, status = ?,
       due_date = ?, owner = ?, updated_at = ? WHERE id = ?`,
      [title, body.description === undefined ? existing.description : cleanText(body.description),
        categoryId, priority, status,
        body.dueDate === undefined ? existing.dueDate : (cleanText(body.dueDate, 10) || null),
        body.owner === undefined ? existing.owner : cleanText(body.owner, 80), timestamp, existing.id]
    );
    if (status !== existing.status) {
      await run('INSERT INTO activity (task_id, message, created_at) VALUES (?, ?, ?)',
        [existing.id, `Moved “${title}” to ${status.replace('_', ' ')}`, timestamp]);
    }
    return response.json({ task: await taskById(existing.id) });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/tasks/:id', async (request, response, next) => {
  try {
    const existing = await taskById(request.params.id);
    if (!existing) return response.status(404).json({ error: 'Task not found.' });
    await run('DELETE FROM tasks WHERE id = ?', [existing.id]);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ error: 'The workspace could not complete that request.' });
});

initializeDatabase()
  .then(() => app.listen(port, () => console.log(`HelloWord is running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exitCode = 1;
  });