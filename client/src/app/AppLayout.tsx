import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';

const appLinks = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/tryouts', label: 'Tryout' },
  { to: '/app/my-tryouts', label: 'Akses Saya' },
  { to: '/app/rankings', label: 'Ranking' },
  { to: '/app/profile', label: 'Profil' },
];

const adminLinks = [
  { to: '/admin', label: 'Ringkasan' },
  { to: '/admin/tryouts', label: 'Tryout' },
  { to: '/admin/questions', label: 'Bank Soal' },
  { to: '/admin/transactions', label: 'Transaksi' },
];

export const PublicLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="page-shell">
      <header className="topbar">
        <NavLink to="/" className="brand-link">
          <img src="/logo.png" alt="Jago CPNS" />
          <span>Jago CPNS Indonesia</span>
        </NavLink>
        <nav className="topnav">
          <NavLink to="/tryouts">Tryout</NavLink>
          <NavLink to="/rankings">Ranking</NavLink>
          {user ? (
            <>
              <NavLink to="/app">Dashboard</NavLink>
              <button className="link-button" onClick={() => void signOut()}>
                Keluar
              </button>
            </>
          ) : (
            <NavLink to="/auth">Masuk</NavLink>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
};

export const AppLayout = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (loading) return <main className="page-content">Memuat sesi...</main>;

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <NavLink to="/app" className="brand-link brand-link--stacked">
          <img src="/logo.png" alt="Jago CPNS" />
          <span>Jago CPNS</span>
        </NavLink>
        <nav>
          {appLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/app'}>
              {link.label}
            </NavLink>
          ))}
          {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
        </nav>
        <button className="secondary-button" onClick={() => void signOut()}>
          Keluar
        </button>
      </aside>
      <main className="workspace-content">
        <Outlet />
      </main>
    </div>
  );
};

export const AdminLayout = () => {
  const { loading, isAdmin } = useAuth();

  if (loading) return <main className="page-content">Memuat admin...</main>;

  if (!isAdmin) {
    return (
      <main className="page-content">
        <div className="panel">
          <h1>Akses admin tidak tersedia</h1>
          <p>Akun ini belum memiliki role admin di Supabase.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <NavLink to="/app" className="brand-link brand-link--stacked">
          <img src="/logo.png" alt="Jago CPNS" />
          <span>Admin</span>
        </NavLink>
        <nav>
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/admin'}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/app">Dashboard User</NavLink>
        </nav>
      </aside>
      <main className="workspace-content">
        <Outlet />
      </main>
    </div>
  );
};
