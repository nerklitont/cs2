import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [upgradePage, setUpgradePage] = useState(1);
  const [upgradeTotal, setUpgradeTotal] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'upgrades') fetchUpgrades();
    if (tab === 'withdrawals') fetchWithdrawals();
  }, [tab, userPage, upgradePage, userSearch]);

  const api = (url, opts = {}) => fetch(url, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }).then(r => r.json());

  const fetchStats = () => api('/api/admin/stats').then(setStats).catch(() => {});
  const fetchUsers = () => {
    const params = new URLSearchParams({ page: userPage, limit: 15 });
    if (userSearch) params.set('search', userSearch);
    api(`/api/admin/users?${params}`).then(d => { setUsers(d.users || []); setUserTotal(d.total || 0); }).catch(() => {});
  };
  const fetchUpgrades = () => {
    api(`/api/admin/upgrades?page=${upgradePage}&limit=15`).then(d => { setUpgrades(d.upgrades || []); setUpgradeTotal(d.total || 0); }).catch(() => {});
  };
  const fetchWithdrawals = () => api('/api/admin/withdrawals').then(setWithdrawals).catch(() => {});

  const updateBalance = async (userId, balance) => {
    const newBalance = prompt('Новый баланс:', balance);
    if (newBalance === null) return;
    await api(`/api/admin/users/${userId}/balance`, { method: 'PUT', body: JSON.stringify({ balance: parseFloat(newBalance) }) });
    fetchUsers();
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Изменить роль на ${newRole}?`)) return;
    await api(`/api/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
    fetchUsers();
  };

  const deleteUser = async (userId) => {
    if (!confirm('Удалить пользователя? Это необратимо!')) return;
    await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
    fetchUsers();
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <h2 className="page-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        АДМИН-ПАНЕЛЬ
      </h2>

      <div className="admin-tabs">
        {['stats', 'users', 'upgrades', 'withdrawals'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'stats' && 'Статистика'}
            {t === 'users' && 'Пользователи'}
            {t === 'upgrades' && 'Апгрейды'}
            {t === 'withdrawals' && 'Выводы'}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.userCount}</span>
            <span className="admin-stat-label">Пользователей</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.total_upgrades}</span>
            <span className="admin-stat-label">Всего апгрейдов</span>
          </div>
          <div className="admin-stat-card win">
            <span className="admin-stat-value">{stats.total_wins}</span>
            <span className="admin-stat-label">Выигрышей</span>
          </div>
          <div className="admin-stat-card lose">
            <span className="admin-stat-value">{stats.total_losses}</span>
            <span className="admin-stat-label">Проигрышей</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.skinCount}</span>
            <span className="admin-stat-label">Скинов в базе</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.totalInventory}</span>
            <span className="admin-stat-label">Предметов у юзеров</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">${stats.totalBalance}</span>
            <span className="admin-stat-label">Общий баланс</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">
              {stats.total_upgrades > 0 ? ((stats.total_wins / stats.total_upgrades) * 100).toFixed(1) : 0}%
            </span>
            <span className="admin-stat-label">Винрейт</span>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-section">
          <div className="admin-toolbar">
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              className="filter-input"
            />
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Баланс</th>
                <th>Роль</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>${u.balance?.toFixed(2)}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('ru')}</td>
                  <td className="admin-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => updateBalance(u.id, u.balance)}>Баланс</button>
                    <button className="btn btn-sm btn-outline" onClick={() => toggleRole(u.id, u.role)}>Роль</button>
                    {u.id !== user.id && (
                      <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)}>Удалить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {userTotal > 15 && (
            <div className="pagination">
              <button className="btn btn-outline" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>←</button>
              <span>Стр. {userPage} из {Math.ceil(userTotal / 15)}</span>
              <button className="btn btn-outline" disabled={userPage >= Math.ceil(userTotal / 15)} onClick={() => setUserPage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      )}

      {tab === 'upgrades' && (
        <div className="admin-section">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Из</th>
                <th>В</th>
                <th>Шанс</th>
                <th>Результат</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {upgrades.map(u => (
                <tr key={u.id} className={u.success ? 'row-win' : 'row-lose'}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.from_name} (${u.from_price?.toFixed(2)})</td>
                  <td>{u.to_name} (${u.to_price?.toFixed(2)})</td>
                  <td>{u.chance?.toFixed(1)}%</td>
                  <td>
                    <span className={`status-badge ${u.success ? 'win' : 'lose'}`}>
                      {u.success ? 'Выигрыш' : 'Проигрыш'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('ru')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {upgradeTotal > 15 && (
            <div className="pagination">
              <button className="btn btn-outline" disabled={upgradePage <= 1} onClick={() => setUpgradePage(p => p - 1)}>←</button>
              <span>Стр. {upgradePage} из {Math.ceil(upgradeTotal / 15)}</span>
              <button className="btn btn-outline" disabled={upgradePage >= Math.ceil(upgradeTotal / 15)} onClick={() => setUpgradePage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="admin-section">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Скин</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">Нет запросов на вывод</td></tr>
              ) : withdrawals.map(w => (
                <tr key={w.id}>
                  <td>{w.id}</td>
                  <td>{w.username}</td>
                  <td>{w.name}</td>
                  <td>${w.price?.toFixed(2)}</td>
                  <td><span className="status-badge pending">{w.status}</span></td>
                  <td>{new Date(w.obtained_at).toLocaleDateString('ru')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
