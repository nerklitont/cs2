import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UpgradeWheel from '../components/UpgradeWheel';
import SkinCard from '../components/SkinCard';
import UpgradeFeed from '../components/UpgradeFeed';
import TopUpgrade from '../components/TopUpgrade';

export default function Home() {
  const { user, token, refreshUser } = useAuth();
  const { stats } = useSocket();

  const [inventory, setInventory] = useState([]);
  const [allSkins, setAllSkins] = useState([]);
  const [selectedFromItem, setSelectedFromItem] = useState(null);
  const [selectedToSkin, setSelectedToSkin] = useState(null);
  const [chance, setChance] = useState(0);
  const [customChance, setCustomChance] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [targetSearch, setTargetSearch] = useState('');
  const [targetSort, setTargetSort] = useState('price_asc');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/user/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(setInventory)
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    if (selectedFromItem) {
      const minPrice = selectedFromItem.price * 1.1;
      fetch(`/api/skins?minPrice=${minPrice}&sort=price&order=asc&limit=100`)
        .then(r => r.json())
        .then(data => setAllSkins(data.skins || []))
        .catch(() => {});
    }
  }, [selectedFromItem]);

  useEffect(() => {
    if (selectedFromItem && selectedToSkin) {
      const baseChance = (selectedFromItem.price / selectedToSkin.price) * 100;
      const clampedChance = Math.min(Math.max(baseChance, 1), 95);
      setChance(clampedChance);
      setCustomChance(Math.round(clampedChance * 10) / 10);
      setMultiplier(selectedToSkin.price / selectedFromItem.price);
    } else {
      setChance(0);
      setCustomChance(0);
      setMultiplier(1);
    }
  }, [selectedFromItem, selectedToSkin]);

  const handleChanceChange = (val) => {
    const v = parseFloat(val);
    if (v > 0 && v <= chance) {
      setCustomChance(v);
      setMultiplier(selectedFromItem.price / (selectedToSkin.price * (v / 100)));
    }
  };

  const handleUpgrade = async () => {
    if (!selectedFromItem || !selectedToSkin || spinning) return;

    setSpinning(true);
    setShowResult(false);

    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inventoryItemId: selectedFromItem.inventory_id,
          targetSkinId: selectedToSkin.id,
          customChance: customChance
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.success);
      setResultData(data);
    } catch (err) {
      alert(err.message);
      setSpinning(false);
    }
  };

  const handleWheelComplete = () => {
    setSpinning(false);
    setShowResult(true);

    refreshUser();

    if (token) {
      fetch('/api/user/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          setInventory(data);
          setSelectedFromItem(null);
          setSelectedToSkin(null);
        })
        .catch(() => {});
    }
  };

  const filteredTargetSkins = allSkins
    .filter(s => !targetSearch || s.name.toLowerCase().includes(targetSearch.toLowerCase()))
    .sort((a, b) => {
      if (targetSort === 'price_asc') return a.price - b.price;
      if (targetSort === 'price_desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="home-page">
      <TopUpgrade />

      <div className="upgrade-section">
        <h2 className="page-title">
          <span className="title-icon">⬆</span>
          UPGRADE
        </h2>

        <div className="upgrade-layout">
          {/* FROM skin */}
          <div className="upgrade-side from-side">
            <h3 className="side-title">Ваш скин</h3>
            {selectedFromItem ? (
              <div className="selected-skin-display" onClick={() => setShowFromPicker(true)}>
                <SkinCard skin={selectedFromItem} size="large" />
                <button className="btn btn-sm btn-outline change-btn">Изменить</button>
              </div>
            ) : (
              <button
                className="skin-picker-btn"
                onClick={() => setShowFromPicker(true)}
                disabled={!user}
              >
                {user ? (
                  <>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <span>Выберите скин из инвентаря</span>
                  </>
                ) : (
                  <span>Войдите для апгрейда</span>
                )}
              </button>
            )}
          </div>

          {/* Wheel */}
          <div className="upgrade-center">
            <UpgradeWheel
              chance={customChance || chance}
              spinning={spinning}
              result={result}
              onComplete={handleWheelComplete}
            />

            {selectedFromItem && selectedToSkin && (
              <div className="chance-controls">
                <div className="chance-display">
                  <span className="chance-label">Шанс</span>
                  <span className="chance-value">{(customChance || chance).toFixed(1)}%</span>
                </div>
                <div className="multiplier-display">
                  <span className="mult-label">Множитель</span>
                  <span className="mult-value">x{multiplier.toFixed(2)}</span>
                </div>
                <div className="chance-slider">
                  <input
                    type="range"
                    min="1"
                    max={Math.min(chance, 95)}
                    step="0.1"
                    value={customChance || chance}
                    onChange={e => handleChanceChange(e.target.value)}
                    disabled={spinning}
                  />
                </div>
                <button
                  className="btn btn-upgrade"
                  onClick={handleUpgrade}
                  disabled={spinning}
                >
                  {spinning ? 'КРУТИМ...' : 'АПГРЕЙД!'}
                </button>
              </div>
            )}
          </div>

          {/* TO skin */}
          <div className="upgrade-side to-side">
            <h3 className="side-title">Желаемый скин</h3>
            {selectedToSkin ? (
              <div className="selected-skin-display" onClick={() => setShowToPicker(true)}>
                <SkinCard skin={selectedToSkin} size="large" />
                <button className="btn btn-sm btn-outline change-btn">Изменить</button>
              </div>
            ) : (
              <button
                className="skin-picker-btn"
                onClick={() => setShowToPicker(true)}
                disabled={!selectedFromItem}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>{selectedFromItem ? 'Выберите желаемый скин' : 'Сначала выберите ваш скин'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result modal */}
      {showResult && resultData && (
        <div className="result-overlay" onClick={() => setShowResult(false)}>
          <div className={`result-modal ${resultData.success ? 'win' : 'lose'}`} onClick={e => e.stopPropagation()}>
            <div className="result-header">
              {resultData.success ? (
                <>
                  <div className="result-icon win">▲</div>
                  <h2>ПОБЕДА!</h2>
                </>
              ) : (
                <>
                  <div className="result-icon lose">✕</div>
                  <h2>ПРОИГРЫШ</h2>
                </>
              )}
            </div>
            <div className="result-skins">
              <div className="result-skin">
                <img src={resultData.fromSkin.image_url} alt="" />
                <span>{resultData.fromSkin.name}</span>
                <span className="result-price">${resultData.fromSkin.price?.toFixed(2)}</span>
              </div>
              <div className="result-arrow">→</div>
              <div className="result-skin">
                <img src={resultData.toSkin.image_url} alt="" />
                <span>{resultData.toSkin.name}</span>
                <span className="result-price">${resultData.toSkin.price?.toFixed(2)}</span>
              </div>
            </div>
            <div className="result-stats">
              <span>Шанс: {resultData.chance?.toFixed(1)}%</span>
              <span>Множитель: x{resultData.multiplier?.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" onClick={() => setShowResult(false)}>Закрыть</button>
          </div>
        </div>
      )}

      {/* FROM skin picker modal */}
      {showFromPicker && (
        <div className="picker-overlay" onClick={() => setShowFromPicker(false)}>
          <div className="picker-modal" onClick={e => e.stopPropagation()}>
            <div className="picker-header">
              <h3>Ваш инвентарь</h3>
              <button className="picker-close" onClick={() => setShowFromPicker(false)}>✕</button>
            </div>
            <div className="picker-grid">
              {inventory.length === 0 ? (
                <div className="picker-empty">
                  Инвентарь пуст. Купите скины на маркете!
                </div>
              ) : inventory.map(item => (
                <SkinCard
                  key={item.inventory_id}
                  skin={item}
                  selected={selectedFromItem?.inventory_id === item.inventory_id}
                  onClick={() => {
                    setSelectedFromItem(item);
                    setSelectedToSkin(null);
                    setShowFromPicker(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TO skin picker modal */}
      {showToPicker && (
        <div className="picker-overlay" onClick={() => setShowToPicker(false)}>
          <div className="picker-modal" onClick={e => e.stopPropagation()}>
            <div className="picker-header">
              <h3>Выберите желаемый скин</h3>
              <div className="picker-filters">
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={targetSearch}
                  onChange={e => setTargetSearch(e.target.value)}
                  className="picker-search"
                />
                <select value={targetSort} onChange={e => setTargetSort(e.target.value)} className="picker-sort">
                  <option value="price_asc">Цена ↑</option>
                  <option value="price_desc">Цена ↓</option>
                  <option value="name">Название</option>
                </select>
              </div>
              <button className="picker-close" onClick={() => setShowToPicker(false)}>✕</button>
            </div>
            <div className="picker-grid">
              {filteredTargetSkins.map(skin => (
                <SkinCard
                  key={skin.id}
                  skin={skin}
                  selected={selectedToSkin?.id === skin.id}
                  onClick={() => {
                    setSelectedToSkin(skin);
                    setShowToPicker(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <UpgradeFeed />
    </div>
  );
}
