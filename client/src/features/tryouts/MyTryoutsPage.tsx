import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { scoreLabel } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';
import { getMyScores, getMyTryoutAccess, getPublishedTryouts } from './tryoutRepository';

export const MyTryoutsPage = () => {
  const state = useAsync(async () => {
    const [access, scores, tryouts] = await Promise.all([
      getMyTryoutAccess(),
      getMyScores(),
      getPublishedTryouts(),
    ]);
    return { access, scores, tryouts };
  }, []);

  if (state.loading) return <LoadingState title="Memuat akses tryout" />;
  if (state.error) return <ErrorState title="Gagal memuat akses" description={state.error} />;
  if (!state.data) return <EmptyState title="Belum ada data" />;

  const { access, scores, tryouts } = state.data;

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Akses saya</span>
        <h1>Tryout dan skor</h1>
      </div>
      <div className="two-column">
        <div className="panel">
          <h2>Tryout dimiliki</h2>
          <div className="list">
            {access.map((item) => {
              const tryout = tryouts.find((entry) => entry.id === item.tryout_list_id);
              return (
                <Link
                  className="list-row"
                  key={item.id}
                  to={`/start-tryout/${item.tryout_list_id}`}
                >
                  <span>{tryout?.title || item.tryout_list_id}</span>
                  <strong>{item.is_done ? 'Selesai' : 'Mulai'}</strong>
                </Link>
              );
            })}
            {access.length === 0 ? <EmptyState title="Belum ada akses" /> : null}
          </div>
        </div>
        <div className="panel">
          <h2>Skor terakhir</h2>
          <div className="list">
            {scores.slice(0, 10).map((score) => (
              <div className="list-row" key={score.id}>
                <span>{tryouts.find((item) => item.id === score.tryout_list_id)?.title}</span>
                <strong>{scoreLabel(score.total_score)}</strong>
              </div>
            ))}
            {scores.length === 0 ? <EmptyState title="Belum ada skor" /> : null}
          </div>
        </div>
      </div>
    </section>
  );
};
