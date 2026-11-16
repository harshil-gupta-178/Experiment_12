import React, { useState, useEffect } from 'react';

const defaultTasks = [
  {
    _id: '1',
    title: 'Deploy to Cloud Platform (AWS / Heroku / GitHub Pages)',
    description: 'Setup server, configure environment variables, and verify live endpoints.',
    status: 'completed',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Configure MongoDB Atlas cluster',
    description: 'Whitelist network IP and test database connection.',
    status: 'in-progress',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [health, setHealth] = useState({ status: 'checking...', database: 'unknown', environment: '' });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({ status: 'active (client mode)', database: 'local storage', environment: 'github pages' });
      }
    } catch {
      setHealth({ status: 'active (client mode)', database: 'local storage', environment: 'github pages' });
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        setLoading(false);
        return;
      }
    } catch {
    }

    const saved = localStorage.getItem('mern_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch {
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
      localStorage.setItem('mern_tasks', JSON.stringify(defaultTasks));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    fetchTasks();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status })
      });
      if (res.ok) {
        const created = await res.json();
        setTasks([created, ...tasks]);
        setTitle('');
        setDescription('');
        setStatus('pending');
        return;
      }
    } catch {
    }

    const newTask = {
      _id: Date.now().toString(),
      title,
      description,
      status,
      createdAt: new Date().toISOString()
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem('mern_tasks', JSON.stringify(updated));
    setTitle('');
    setDescription('');
    setStatus('pending');
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter((t) => t._id !== id));
        return;
      }
    } catch {
    }

    const updated = tasks.filter((t) => t._id !== id);
    setTasks(updated);
    localStorage.setItem('mern_tasks', JSON.stringify(updated));
  };

  return (
    <div className="container">
      <header>
        <h1 className="title">MERN Application</h1>
        <p className="subtitle">MongoDB, Express, React, Node.js</p>
        <div className="badge-row">
          <div className="badge">
            <span className="dot online" />
            API: {health.status}
          </div>
          <div className="badge">
            <span className="dot online" />
            DB: {health.database}
          </div>
          <div className="badge">
            <span>Environment: {health.environment || 'production'}</span>
          </div>
        </div>
      </header>

      <main>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Add Task</h3>
          <form onSubmit={handleAddTask} className="form-group">
            <input
              type="text"
              className="input-field"
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="textarea-field"
              placeholder="Task Description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                className="select-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button type="submit" className="btn" style={{ marginLeft: 'auto' }}>
                Add Task
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Tasks ({tasks.length})</h3>
            <button onClick={fetchTasks} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading items...</p>
          ) : tasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No tasks found.</p>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div key={task._id} className="task-item">
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span className={`status-tag status-${task.status}`}>{task.status}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(task._id)} className="btn btn-danger">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
