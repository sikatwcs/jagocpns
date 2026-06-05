import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { StatCard } from '../components/StatCard';
import { getPublishedTryouts } from '../features/tryouts/tryoutRepository';
import { formatCurrency } from '../lib/utils/format';
import { useAsync } from '../lib/utils/useAsync';

export const HomePage = () => {
  const { data, loading, error } = useAsync(() =>
    getPublishedTryouts({ limit: 6 }),
  );

  return (
    <main className="page-content">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Platform latihan CPNS</span>
          <h1>Jago CPNS Indonesia</h1>
          <p>
            Tryout, ranking, akses premium, transaksi, dan bank soal sekarang
            berjalan langsung di Supabase.
          </p>
          <div className="button-row">
            <Link className="primary-button" to="/tryouts">
              Lihat tryout
            </Link>
            <Link className="secondary-button" to="/auth">
              Masuk akun
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <StatCard label="Schema" value="Supabase" tone="blue" />
          <StatCard label="API lama" value="Off" tone="red" />
          <StatCard label="Frontend" value="TypeScript" tone="gold" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <span className="eyebrow">Paket aktif</span>
          <h2>Tryout yang tersedia</h2>
        </div>
        {loading ? <LoadingState title="Memuat tryout" /> : null}
        {error ? <ErrorState title="Gagal memuat tryout" description={error} /> : null}
        {!loading && !error && data?.length === 0 ? (
          <EmptyState
            title="Belum ada tryout published"
            description="Data lama sudah dimigrasikan; pastikan status tryout published."
          />
        ) : null}
        <div className="card-grid">
          {data?.map((tryout) => (
            <Link className="tryout-card" key={tryout.id} to={`/tryouts/${tryout.id}`}>
              {tryout.thumbnail_url ? (
                <img src={tryout.thumbnail_url} alt="" />
              ) : (
                <div className="card-image-placeholder">Jago CPNS</div>
              )}
              <div>
                <span>{tryout.type} Batch {tryout.batch}</span>
                <h3>{tryout.title}</h3>
                <p>{tryout.description || 'Paket latihan CPNS'}</p>
                <strong>{formatCurrency(tryout.price)}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};
