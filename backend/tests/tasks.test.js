const request = require('supertest');
const { app, server } = require('../src/server');
const pool = require('../src/config/db');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

let authToken;
let userId;

beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      status VARCHAR(50) DEFAULT 'todo',
      priority VARCHAR(50) DEFAULT 'medium',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM users');

  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'taskuser', email: 'task@example.com', password: 'password123' });

  authToken = res.body.token;
  userId = res.body.user.id;
});

beforeEach(async () => {
  await pool.query('DELETE FROM tasks');
});

afterAll(async () => {
  await pool.end();
  server.close();
});

describe('GET /api/tasks', () => {
  test('should return empty array when no tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('should require authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  test('should return all tasks', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Task 1' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Task 2' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('POST /api/tasks', () => {
  test('should create a task with title only', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New Task' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Task');
    expect(res.body.status).toBe('todo');
    expect(res.body.priority).toBe('medium');
  });

  test('should create a task with all fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Full Task', description: 'Desc', status: 'in-progress', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('in-progress');
    expect(res.body.priority).toBe('high');
  });

  test('should fail without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'No title' });

    expect(res.status).toBe(400);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Unauthenticated' });

    expect(res.status).toBe(401);
  });

  test('should set created_by to current user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'User Task' });

    expect(res.body.created_by).toBe(userId);
  });
});

describe('PATCH /api/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Original', status: 'todo', priority: 'low' });
    taskId = res.body.id;
  });

  test('should update task title', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  test('should update task status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .patch('/api/tasks/99999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Ghost' });

    expect(res.status).toBe(404);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ title: 'No auth' });

    expect(res.status).toBe(401);
  });

  test('should preserve unchanged fields', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in-progress' });

    expect(res.body.title).toBe('Original');
    expect(res.body.priority).toBe('low');
  });
});

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'To Delete' });
    taskId = res.body.id;
  });

  test('should delete existing task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .delete('/api/tasks/99999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  test('should require authentication', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(401);
  });

  test('should actually remove task from database', async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const getRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    const found = getRes.body.find(t => t.id === taskId);
    expect(found).toBeUndefined();
  });
});
