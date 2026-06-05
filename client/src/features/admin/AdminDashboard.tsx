import { ErrorState, LoadingState } from '../../components/StateViews';
import { StatCard } from '../../components/StatCard';
import { useAsync } from '../../lib/utils/useAsync';
import { getAdminMetrics } from './adminRepository';

export const AdminDashboard = () => {
  const state = useAsync(getAdminMetrics, []);

  if (state.loading) return <LoadingState title="Memuat admin" />;
  if (state.error) return <ErrorState title="Admin gagal dimuat" description={state.error} />;

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Admin</span>
        <h1>Ringkasan Supabase</h1>
      </div>
      <div className="stat-grid">
        <StatCard label="Tryout" value={state.data?.tryouts ?? 0} />
        <StatCard label="Soal" value={state.data?.questions ?? 0} tone="gold" />
        <StatCard label="Profil" value={state.data?.profiles ?? 0} tone="green" />
        <StatCard label="Transaksi" value={state.data?.transactions ?? 0} />
        <StatCard label="Skor" value={state.data?.scores ?? 0} tone="gold" />
      </div>
    </section>
  );
};
