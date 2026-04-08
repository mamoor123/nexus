'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', email: '', department_id: '' });
  const [password, setPassword] = useState({ current_password: '', new_password: '', confirm: '' });
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setProfile({ name: user.name, email: user.email, department_id: user.department_id || '' });
    api.getDepartments().then(setDepartments).catch(() => {});
    if (user.role === 'admin') {
      api.getUsers().then(setUsers).catch(() => {});
    }
  }, [user]);

  const saveProfile = async () => {
    if (!profile.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await api.updateProfile({ name: profile.name, department_id: profile.department_id || null });
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!password.current_password || !password.new_password) {
      toast.error('All fields are required');
      return;
    }
    if (password.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password.new_password !== password.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ current_password: password.current_password, new_password: password.new_password });
      setPassword({ current_password: '', new_password: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const updateRole = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (err) { toast.error(err.message); }
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    ...(user?.role === 'admin' ? [{ id: 'team', label: '👥 Team', icon: '👥' }] : []),
    { id: 'about', label: 'ℹ️ About', icon: 'ℹ️' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>⚙️ Settings</h2>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* Tabs */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: activeTab === tab.id ? '#1e1b4b' : 'transparent',
              border: 'none', borderRadius: 8, padding: '8px 12px',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', marginBottom: 4,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 400 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Name</label>
                  <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input value={profile.email} disabled style={{ opacity: 0.6 }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Email cannot be changed</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Department</label>
                  <select value={profile.department_id} onChange={e => setProfile({ ...profile, department_id: e.target.value })}>
                    <option value="">No department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role</label>
                  <input value={user?.role || ''} disabled style={{ opacity: 0.6, textTransform: 'capitalize' }} />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn" style={{ alignSelf: 'flex-start' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Change Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 400 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Current Password</label>
                  <input type="password" value={password.current_password}
                    onChange={e => setPassword({ ...password, current_password: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>New Password</label>
                  <input type="password" value={password.new_password}
                    onChange={e => setPassword({ ...password, new_password: e.target.value })} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Minimum 8 characters</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
                  <input type="password" value={password.confirm}
                    onChange={e => setPassword({ ...password, confirm: e.target.value })} />
                </div>
                <button onClick={changePassword} disabled={saving} className="btn" style={{ alignSelf: 'flex-start' }}>
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && user?.role === 'admin' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Team Members</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
                  }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{u.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</p>
                    </div>
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                      style={{ width: 'auto', fontSize: '0.8rem' }}>
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>About Company OS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Version</span>
                  <span>0.2.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Backend</span>
                  <span>Node.js + Express + SQLite</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Frontend</span>
                  <span>Next.js 14 + React</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Real-time</span>
                  <span>Socket.IO</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>AI Engine</span>
                  <span>OpenAI-compatible API</span>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    AI-Powered Company Operating System — automate and manage entire business operations through intelligent AI agents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
