import { useState, useEffect } from 'react';

export default function TopUpgrade() {
  const [top, setTop] = useState(null);

  useEffect(() => {
    fetch('/api/upgrade/top')
      .then(r => r.json())
      .then(data => { if (data) setTop(data); })
      .catch(() => {});
  }, []);

  if (!top) return null;

  return (
    <div className="top-upgrade">
      <div className="top-upgrade-badge">ТОП АПГРЕЙД</div>
      <div className="top-upgrade-content">
        <div className="top-upgrade-user">
          <span className="top-username">{top.username}</span>
        </div>
        <div className="top-upgrade-skins">
          <div className="top-skin">
            <img src={top.from_image} alt={top.from_name} />
            <span className="top-skin-name">{top.from_name}</span>
            <span className="top-skin-price">${top.from_price?.toFixed(2)}</span>
          </div>
          <div className="top-arrow">
            <span className="top-multiplier">x{top.multiplier?.toFixed(1)}</span>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#de9b35" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div className="top-skin">
            <img src={top.to_image} alt={top.to_name} />
            <span className="top-skin-name">{top.to_name}</span>
            <span className="top-skin-price">${top.to_price?.toFixed(2)}</span>
          </div>
        </div>
        <div className="top-chance">Шанс: {top.chance?.toFixed(1)}%</div>
      </div>
    </div>
  );
}
