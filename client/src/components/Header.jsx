import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { online, stats } = useSocket();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">⬆</span>
          <span className="logo-text">CS2</span>
          <span className="logo-accent">UPGRADE</span>
        </Link>

        <nav className="nav">
          <Link to="/" className={isActive('/')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 12 9-9 9 9"/><path d="M9 21V9h6v12"/></svg>
            Главная
          </Link>
          <Link to="/market" className={isActive('/market')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Маркет
          </Link>
          {user && (
            <Link to="/profile" className={isActive('/profile')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Профиль
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Админ
            </Link>
          )}
        </nav>

        <div className="header-right">
          <div className="header-stats">
            <div className="stat-badge online">
              <span className="stat-dot"></span>
              <span>{online}</span>
            </div>
            <div className="stat-badge upgrades">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              <span>{stats.total_upgrades}</span>
            </div>
          </div>

          {user ? (
            <div className="user-panel">
              <div className="balance-badge">
                <span className="balance-icon">$</span>
                <span className="balance-value">{user.balance?.toFixed(2)}</span>
              </div>
              <div className="user-info">
                <span className="username">{user.username}</span>
                <button onClick={logout} className="btn-logout">Выход</button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Войти</Link>
              <Link to="/register" className="btn btn-primary">Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
