import React, { useState, useEffect } from 'react';

const initialTasks = [
  {
    _id: '1',
    title: 'Complete project report',
    description: 'Prepare documentation and verify requirements.',
    status: 'completed'
  },
  {
    _id: '2',
    title: 'Review implementation',
    description: 'Check functionality and test cases.',
    status: 'in-progress'
  }
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        return;
      }
    } catch {}

    const saved = localStorage.getItem('tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks(initialTasks);
      localStorage.setItem('tasks', JSON.stringify(initialTasks));
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdd = async (e) => {
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
        return;
      }
    } catch {}

    const newTask = {
      _id: Date.now().toString(),
      title,
      description,
      status
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem('tasks', JSON.stringify(updated));
    setTitle('');
    setDescription('');
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter((t) => t._id !== id));
        return;
      }
    } catch {}

    const updated = tasks.filter((t) => t._id !== id);
    setTasks(updated);
    localStorage.setItem('tasks', JSON.stringify(updated));
  };

  return (
    <div className="container">
      <h1>Task Manager</h1>

      <form onSubmit={handleAdd}>
        <h3>Add Task</h3>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Task description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit">Submit Task</button>
      </form>

      <div>
        <h3>Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p>No tasks available.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id} className="task-item">
                <div className="task-details">
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                  <span className="task-status">Status: {task.status}</span>
                </div>
                <button onClick={() => handleDelete(task._id)} className="btn-delete">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
