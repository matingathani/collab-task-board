import { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import TaskCard from './TaskCard';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function TaskBoard({ token, user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [connected, setConnected] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API_URL}/api/tasks`, { headers }).then((res) => setTasks(res.data));

    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('task:created', (task) => {
      setTasks((prev) => [task, ...prev]);
    });

    socket.on('task:updated', (task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    });

    socket.on('task:deleted', ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.disconnect();
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await axios.post(
        `${API_URL}/api/tasks`,
        { title: newTitle, description: newDescription, priority: newPriority },
        { headers }
      );
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
    } catch (err) {
      console.error('Create task failed:', err);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await axios.patch(`${API_URL}/api/tasks/${id}`, updates, { headers });
    } catch (err) {
      console.error('Update task failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`, { headers });
    } catch (err) {
      console.error('Delete task failed:', err);
    }
  };

  const statuses = ['todo', 'in-progress', 'done'];
  const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Collaborative Task Board</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: connected ? 'green' : 'red' }}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      <form onSubmit={handleCreate} style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Task title..."
          style={{ flex: 2, minWidth: 200, padding: 8 }}
          required
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ flex: 3, minWidth: 200, padding: 8 }}
        />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ padding: 8 }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>Add Task</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {statuses.map((status) => (
          <div key={status} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>
              {statusLabels[status]} ({tasks.filter((t) => t.status === status).length})
            </h3>
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
