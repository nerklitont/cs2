import { useSocket } from '../context/SocketContext';

export default function UpgradeFeed() {
  const { feed } = useSocket();

  if (!feed.length) {
    return (
      <div className="feed-section">
        <h3 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Лента апгрейдов
        </h3>
        <div className="feed-empty">Пока нет апгрейдов</div>
      </div>
    );
  }

  return (
    <div className="feed-section">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Лента апгрейдов
      </h3>
      <div className="feed-list">
        {feed.map((item, i) => (
          <div key={item.upgradeId || item.id || i} className={`feed-item ${item.success ? 'win' : 'lose'}`}>
            <div className="feed-user">
              <span className="feed-username">{item.user?.username || item.username}</span>
            </div>
            <div className="feed-skins">
              <div className="feed-skin from">
                <img src={item.fromSkin?.image_url || item.from_image} alt="" />
                <span className="feed-skin-price">${(item.fromSkin?.price || item.from_price)?.toFixed(2)}</span>
              </div>
              <div className="feed-arrow">
                {item.success ? (
                  <span className="feed-result win">▲</span>
                ) : (
                  <span className="feed-result lose">✕</span>
                )}
              </div>
              <div className="feed-skin to">
                <img src={item.toSkin?.image_url || item.to_image} alt="" />
                <span className="feed-skin-price">${(item.toSkin?.price || item.to_price)?.toFixed(2)}</span>
              </div>
            </div>
            <div className="feed-meta">
              <span className="feed-chance">{(item.chance)?.toFixed(1)}%</span>
              <span className="feed-multiplier">x{(item.multiplier)?.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
