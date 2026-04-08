'use client';
import './globals.css';
import { AuthProvider, useAuth } from '../lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/departments', label: 'Departments', icon: '🏢' },
    { href: '/tasks', label: 'Tasks', icon: '📋' },
    { href: '/agents', label: 'AI Agents', icon: '🤖' },
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/knowledge', label: 'Knowledge', icon: '📚' },
    { href: '/email', label: 'Email', icon: '📧' },
    { href: '/workflows', label: 'Workflows', icon: '⚡' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', padding: '1rem',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🏢 Company OS</h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-Powered Operations</p>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {nav.map(n => (
          <Link key={n.href} href={n.href} style={{
            padding: '0.5rem 0.75rem', borderRadius: 8, textDecoration: 'none',
            color: pathname.startsWith(n.href) ? '#fff' : 'var(--text-muted)',
            background: pathname.startsWith(n.href) ? '#1e1b4b' : 'transparent',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>{n.icon}</span> {n.label}
          </Link>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.8rem', marginBottom: '4px' }}>{user.name}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{user.role}</p>
        <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', fontSize: '0.8rem' }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function AppShell({ children }) {
  const { user } = useAuth();

  if (!user) return children;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '2rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
