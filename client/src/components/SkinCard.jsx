export default function SkinCard({ skin, onClick, selected, showPrice = true, size = 'normal' }) {
  return (
    <div
      className={`skin-card ${selected ? 'selected' : ''} ${size}`}
      onClick={() => onClick?.(skin)}
      style={{ '--rarity-color': skin.rarity_color || skin.rarityColor || '#4b69ff' }}
    >
      <div className="skin-card-glow"></div>
      <div className="skin-card-image">
        <img
          src={skin.image_url || skin.imageUrl}
          alt={skin.name}
          loading="lazy"
          onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%23333"><rect width="200" height="200"/><text x="100" y="100" text-anchor="middle" fill="%23666" font-size="14">No Image</text></svg>'; }}
        />
      </div>
      <div className="skin-card-info">
        <span className="skin-weapon">{skin.weapon}</span>
        <span className="skin-name">{skin.name?.replace(`${skin.weapon} | `, '')}</span>
        {skin.exterior && <span className="skin-exterior">{skin.exterior}</span>}
        {showPrice && <span className="skin-price">${skin.price?.toFixed(2)}</span>}
      </div>
      <div className="skin-card-rarity" style={{ backgroundColor: skin.rarity_color || skin.rarityColor }}></div>
    </div>
  );
}
