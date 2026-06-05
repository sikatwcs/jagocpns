import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { formatCurrency } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';
import { getPublishedTryouts } from './tryoutRepository';

export const TryoutStorePage = () => {
  const [type, setType] = useState('all');
  const { data, loading, error } = useAsync(() => getPublishedTryouts(), []);

  const types = useMemo(
    () => ['all', ...Array.from(new Set((data ?? []).map((item) => item.type)))],
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    if (type === 'all') return data;
    return data.filter((item) => item.type === type);
  }, [data, type]);

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Tryout</span>
        <h1>Paket tersedia</h1>
      </div>
      <div className="segmented">
        {types.map((item) => (
          <button
            key={item}
            className={type === item ? 'active' : ''}
            onClick={() => setType(item)}
          >
            {item === 'all' ? 'Semua' : item}
          </button>
        ))}
      </div>
      {loading ? <LoadingState title="Memuat tryout" /> : null}
      {error ? <ErrorState title="Gagal memuat tryout" description={error} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title="Tidak ada tryout pada filter ini" />
      ) : null}
      <div className="card-grid">
        {filtered.map((tryout) => (
          <Link className="tryout-card" key={tryout.id} to={`/tryouts/${tryout.id}`}>
            {tryout.thumbnail_url ? (
              <img src={tryout.thumbnail_url} alt="" />
            ) : (
              <div className="card-image-placeholder">Batch {tryout.batch}</div>
            )}
            <div>
              <span>{tryout.type} Batch {tryout.batch}</span>
              <h3>{tryout.title}</h3>
              <p>{tryout.description || 'Latihan berbasis soal CPNS'}</p>
              <strong>{formatCurrency(tryout.price)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
