import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SkinCard from '../components/SkinCard';

export default function Market() {
  const { user, token, refreshUser } = useAuth();
  const [skins, setSkins] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [rarity, setRarity] = useState('');
  const [sort, setSort] = useState('price');
  const [order, setOrder] = useState('asc');
  const [categories, setCategories] = useState([]);
  const [rarities, setRarities] = useState([]);
  const [buying, setBuying] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetch('/api/skins/categories').then(r => r.json()).then(setCategories).catch(() => {});
    fetch('/api/skins/rarities').then(r => r.json()).then(setRarities).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page, sort, order, limit: 24 });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (rarity) params.set('rarity', rarity);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    fetch(`/api/skins?${params}`)
      .then(r => r.json())
      .then(data => {
        setSkins(data.skins || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {});
  }, [page, search, category, rarity, sort, order, minPrice, maxPrice]);

  const handleBuy = async (skin) => {
    if (!user) return alert('Войдите в аккаунт');
    if (buying) return;
    if (user.balance < skin.price) return alert('Недостаточно средств');

    setBuying(skin.id);
    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skinId: skin.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refreshUser();
      alert('Скин куплен!');
    } catch (err) {
      alert(err.message);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="market-page">
      <h2 className="page-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        МАРКЕТ
        <span className="title-count">{total} скинов</span>
      </h2>

      <div className="market-filters">
        <input
          type="text"
          placeholder="Поиск скинов..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="filter-input search-input"
        />

        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="filter-select">
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={rarity} onChange={e => { setRarity(e.target.value); setPage(1); }} className="filter-select">
          <option value="">Все редкости</option>
          {rarities.map(r => <option key={r.rarity} value={r.rarity}>{r.rarity}</option>)}
        </select>

        <div className="price-filter">
          <input
            type="number"
            placeholder="Мин. $"
            value={minPrice}
            onChange={e => { setMinPrice(e.target.value); setPage(1); }}
            className="filter-input price-input"
          />
          <span className="price-sep">—</span>
          <input
            type="number"
            placeholder="Макс. $"
            value={maxPrice}
            onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
            className="filter-input price-input"
          />
        </div>

        <select value={`${sort}_${order}`} onChange={e => {
          const [s, o] = e.target.value.split('_');
          setSort(s); setOrder(o); setPage(1);
        }} className="filter-select">
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
          <option value="name_asc">Название A-Z</option>
          <option value="name_desc">Название Z-A</option>
        </select>
      </div>

      <div className="market-grid">
        {skins.map(skin => (
          <div key={skin.id} className="market-item">
            <SkinCard skin={skin} />
            <button
              className="btn btn-buy"
              onClick={() => handleBuy(skin)}
              disabled={buying === skin.id || (user && user.balance < skin.price)}
            >
              {buying === skin.id ? 'Покупка...' : `Купить $${skin.price.toFixed(2)}`}
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >← Назад</button>
          <span className="page-info">Страница {page} из {totalPages}</span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >Далее →</button>
        </div>
      )}
    </div>
  );
}
