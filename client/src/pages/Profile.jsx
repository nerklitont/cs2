import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkinCard from '../components/SkinCard';

export default function Profile() {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('inventory');
  const [depositAmount, setDepositAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchInventory();
    fetchHistory();
  }, [user]);

  const fetchInventory = () => {
    fetch('/api/user/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setInventory)
      .catch(() => {});
  };

  const fetchHistory = () => {
    fetch('/api/user/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setHistory)
      .catch(() => {});
  };

  const handleSell = async (inventoryId, price) => {
    if (!confirm(`Продать за $${(price * 0.9).toFixed(2)} (10% комиссия)?`)) return;
    try {
      const res = await fetch('/api/market/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inventoryId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refreshUser();
      fetchInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleWithdraw = async (inventoryId) => {
    if (!confirm('Запросить вывод предмета?')) return;
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inventoryId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Запрос на вывод создан!');
      fetchInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    try {
      const res = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refreshUser();
      setShowDeposit(false);
      setDepositAmount('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) return null;

  const totalValue = inventory.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {user.username[0].toUpperCase()}
          </div>
          <div className="profile-details">
            <h2 className="profile-name">{user.username}</h2>
            <span className="profile-email">{user.email}</span>
            <span className="profile-date">На сайте с {new Date(user.created_at).toLocaleDateString('ru')}</span>
          </div>
        </div>
        <div className="profile-stats-row">
          <div className="profile-stat">
            <span className="profile-stat-label">Баланс</span>
            <span className="profile-stat-value">${user.balance?.toFixed(2)}</span>
            <button className="btn btn-sm btn-primary" onClick={() => setShowDeposit(true)}>Пополнить</button>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-label">Предметов</span>
            <span className="profile-stat-value">{inventory.length}</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-label">Стоимость инвентаря</span>
            <span className="profile-stat-value">${totalValue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {showDeposit && (
        <div className="result-overlay" onClick={() => setShowDeposit(false)}>
          <div className="result-modal" onClick={e => e.stopPropagation()}>
            <h3>Пополнить баланс</h3>
            <div className="deposit-form">
              <input
                type="number"
                placeholder="Сумма в $"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="filter-input"
                min="1"
                max="100000"
              />
              <div className="deposit-presets">
                {[10, 50, 100, 500, 1000].map(amt => (
                  <button key={amt} className="btn btn-outline btn-sm" onClick={() => setDepositAmount(String(amt))}>
                    ${amt}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleDeposit}>Пополнить</button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-tabs">
        <button className={`tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>
          Инвентарь ({inventory.length})
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          История апгрейдов
        </button>
      </div>

      {tab === 'inventory' && (
        <div className="inventory-grid">
          {inventory.length === 0 ? (
            <div className="empty-state">
              <p>Инвентарь пуст</p>
              <a href="/market" className="btn btn-primary">Перейти в маркет</a>
            </div>
          ) : inventory.map(item => (
            <div key={item.inventory_id} className="inventory-item">
              <SkinCard skin={item} />
              <div className="inventory-actions">
                <button className="btn btn-sm btn-outline" onClick={() => handleSell(item.inventory_id, item.price)}>
                  Продать (${(item.price * 0.9).toFixed(2)})
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => handleWithdraw(item.inventory_id)}>
                  Вывести
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state">
              <p>Нет истории апгрейдов</p>
            </div>
          ) : history.map((item, i) => (
            <div key={i} className={`history-item ${item.success ? 'win' : 'lose'}`}>
              <div className="history-skins">
                <div className="history-skin">
                  <img src={item.from_image} alt="" />
                  <div>
                    <span className="history-skin-name">{item.from_name}</span>
                    <span className="history-skin-price">${item.from_price?.toFixed(2)}</span>
                  </div>
                </div>
                <span className={`history-arrow ${item.success ? 'win' : 'lose'}`}>
                  {item.success ? '→' : '✕'}
                </span>
                <div className="history-skin">
                  <img src={item.to_image} alt="" />
                  <div>
                    <span className="history-skin-name">{item.to_name}</span>
                    <span className="history-skin-price">${item.to_price?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="history-meta">
                <span className="history-chance">{item.chance?.toFixed(1)}%</span>
                <span className="history-mult">x{item.multiplier?.toFixed(1)}</span>
                <span className="history-date">{new Date(item.created_at).toLocaleDateString('ru')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
