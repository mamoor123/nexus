'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '🏢', color: '#6366f1' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.getDepartments().then(setDepartments).catch(console.error);
  }, [user]);

  const handleCreate = async () => {
    if (!form.name) { alert('Name is required'); return; }
    try {
      const dept = await api.createDepartment(form);
      setDepartments([...departments, { ...dept, member_count: 0, agent_count: 0, active_tasks: 0 }]);
      setShowForm(false);
      setForm({ name: '', description: '', icon: '🏢', color: '#6366f1' });
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    await api.deleteDepartment(id);
    setDepartments(departments.filter(d => d.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Departments</h2>
        {user?.role === 'admin' && (
          <button className="btn" onClick={() => setShowForm(!showForm)}>+ New Department</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Name</label>
            <input placeholder="Engineering" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ flex: 2, minWidth: 300 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description</label>
            <input placeholder="What this department does" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ width: 60 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Icon</label>
            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
          </div>
          <button onClick={handleCreate} className="btn">Create</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {departments.map(d => (
          <div key={d.id} className="card" style={{ borderLeft: `3px solid ${d.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{d.icon} {d.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{d.description}</p>
              </div>
              {user?.role === 'admin' && (
                <button onClick={() => handleDelete(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}>✕</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👥 {d.member_count} members</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🤖 {d.agent_count} agents</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📋 {d.active_tasks} tasks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
