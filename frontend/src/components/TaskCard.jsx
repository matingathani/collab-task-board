export default function TaskCard({ task, onUpdate, onDelete }) {
  const statusColors = {
    todo: '#e3f2fd',
    'in-progress': '#fff9c4',
    done: '#e8f5e9',
  };

  const priorityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
  };

  return (
    <div
      style={{
        background: statusColors[task.status] || '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ margin: 0 }}>{task.title}</h4>
        <span
          style={{
            background: priorityColors[task.priority] || '#grey',
            color: 'white',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 12,
          }}
        >
          {task.priority}
        </span>
      </div>
      {task.description && <p style={{ margin: '8px 0', color: '#666' }}>{task.description}</p>}
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <select
          value={task.status}
          onChange={(e) => onUpdate(task.id, { status: e.target.value })}
          style={{ fontSize: 12 }}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button
          onClick={() => onDelete(task.id)}
          style={{ fontSize: 12, background: '#f44336', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
