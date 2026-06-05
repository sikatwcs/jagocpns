import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../auth/AuthProvider';
import {
  getMyScores,
  getMyTransactions,
  getMyTryoutAccess,
  getPublishedTryouts,
  getWalletBalance,
  transactionStatusLabel,
} from '../tryouts/tryoutRepository';
import { formatCurrency, scoreLabel } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';

export const DashboardPage = () => {
  const { profile } = useAuth();
  const summary = useAsync(async () => {
    const [tryouts, access, scores, balance, transactions] = await Promise.all([
      getPublishedTryouts({ limit: 4 }),
      getMyTryoutAccess(),
      getMyScores(),
      getWalletBalance(),
      getMyTransactions(),
    ]);

    return { tryouts, access, scores, balance, transactions };
  }, [profile?.id]);

  if (summary.loading) return <LoadingState title="Memuat dashboard" />;
  if (summary.error) {
    return <ErrorState title="Dashboard gagal dimuat" description={summary.error} />;
  }

  const data = summary.data;
  if (!data) return <EmptyState title="Data belum tersedia" />;

  const bestScore = data.scores.reduce(
    (max, score) => Math.max(max, Number(score.total_score)),
    0,
  );

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Dashboard</span>
        <h1>Halo, {profile?.full_name || profile?.email || 'pejuang CPNS'}</h1>
      </div>
      <div className="stat-grid">
        <StatCard label="Saldo" value={formatCurrency(data.balance?.amount)} />
        <StatCard label="Akses tryout" value={data.access.length} tone="green" />
        <StatCard label="Riwayat skor" value={data.scores.length} tone="gold" />
        <StatCard label="Skor terbaik" value={scoreLabel(bestScore)} tone="blue" />
      </div>

      <div className="two-column">
        <div className="panel">
          <div className="panel-heading">
            <h2>Tryout aktif</h2>
            <Link to="/app/tryouts">Lihat semua</Link>
          </div>
          <div className="list">
            {data.tryouts.map((tryout) => (
              <Link key={tryout.id} to={`/app/tryouts/${tryout.id}`} className="list-row">
                <span>{tryout.title}</span>
                <strong>{formatCurrency(tryout.price)}</strong>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h2>Transaksi terbaru</h2>
            <Link to="/app/profile">Top up</Link>
          </div>
          <div className="list">
            {data.transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="list-row">
                <span>{transaction.invoice_number || transaction.kind}</span>
                <strong>{transactionStatusLabel(transaction.payment_status)}</strong>
              </div>
            ))}
            {data.transactions.length === 0 ? (
              <EmptyState title="Belum ada transaksi" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
