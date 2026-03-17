# Collab Task Board

![CI](https://github.com/matingathani/collab-task-board/actions/workflows/ci.yml/badge.svg)

A real-time collaborative task management application built with Node.js, Express, Socket.io, PostgreSQL, and React.

## Features

- Real-time updates via WebSocket (Socket.io)
- User authentication with JWT
- Kanban-style board with three columns: To Do, In Progress, Done
- Task priority levels (low, medium, high)
- RESTful API with 25+ integration tests

## Tech Stack

**Backend:** Node.js, Express, Socket.io, PostgreSQL, JWT, bcrypt

**Frontend:** React, Vite, socket.io-client, Axios

**Infrastructure:** Docker Compose, GitHub Actions CI

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:3001

### Run Locally

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/tasks | Get all tasks |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| task:created | Server → Client | New task created |
| task:updated | Server → Client | Task updated |
| task:deleted | Server → Client | Task deleted |

## Running Tests

```bash
cd backend
npm test
```

## CI/CD

GitHub Actions runs all backend tests on every push and pull request to main. See `.github/workflows/ci.yml`.
