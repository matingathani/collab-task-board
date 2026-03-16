const request = require('supertest');
const { app, server } = require('../src/server');
const pool = require('../src/config/db');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

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
});

beforeEach(async () => {
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.end();
  server.close();
});

describe('POST /api/auth/register', () => {
  test('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  test('should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('should fail with duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', email: 'dup@example.com', password: 'pass123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user2', email: 'dup@example.com', password: 'pass456' });

    expect(res.status).toBe(409);
  });

  test('should fail with duplicate username', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'sameuser', email: 'user1@example.com', password: 'pass123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'sameuser', email: 'user2@example.com', password: 'pass456' });

    expect(res.status).toBe(409);
  });

  test('should return valid JWT token on register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'jwtuser', email: 'jwt@example.com', password: 'password' });

    expect(res.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'logintest', email: 'login@example.com', password: 'correct-password' });
  });

  test('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  test('should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  test('should fail with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notexist@example.com', password: 'password' });

    expect(res.status).toBe(401);
  });

  test('should fail with missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com' });

    expect(res.status).toBe(400);
  });

  test('should return user info without password on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correct-password' });

    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.id).toBeDefined();
  });
});
