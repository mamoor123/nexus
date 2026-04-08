'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.getDashboard().then(setStats).catch(console.error);
  }, [user]);

  if (!stats) return <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>;

  const StatCard = ({ icon, label, value, color }) => (
    <div className="card" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</p>
        </div>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Welcome back, {user.name} 👋
      </h2>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <StatCard icon="🏢" label="Departments" value={stats.departments} />
        <StatCard icon="👥" label="Team Members" value={stats.users} />
        <StatCard icon="🤖" label="AI Agents" value={stats.agents} />
        <StatCard icon="📋" label="Active Tasks" value={stats.tasks.pending + stats.tasks.in_progress} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Tasks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recent_tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tasks yet. Create one to get started!</p>
            ) : (
              stats.recent_tasks.map(t => (
                <div key={t.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 8
                }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.department_icon} {t.department_name || 'Unassigned'} · {t.assignee_name || 'No assignee'}
                    </p>
                  </div>
                  <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Agent Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem' }}>🟢 Active</span>
              <span style={{ fontWeight: 600 }}>{stats.agents_by_status.active}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem' }}>🟡 Paused</span>
              <span style={{ fontWeight: 600 }}>{stats.agents_by_status.paused}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem' }}>🔴 Offline</span>
              <span style={{ fontWeight: 600 }}>{stats.agents_by_status.offline}</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Task Breakdown</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-pending">⏳ {stats.tasks.pending} pending</span>
              <span className="badge badge-in_progress">🔄 {stats.tasks.in_progress} active</span>
              <span className="badge badge-completed">✅ {stats.tasks.completed} done</span>
              {stats.tasks.urgent > 0 && <span className="badge badge-urgent">🔥 {stats.tasks.urgent} urgent</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
