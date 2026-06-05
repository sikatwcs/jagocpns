import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { scoreLabel } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';
import { getPublishedTryouts, getRankings } from '../tryouts/tryoutRepository';

export const RankingsPage = () => {
  const [tryoutId, setTryoutId] = useState('');
  const state = useAsync(async () => {
    const tryouts = await getPublishedTryouts();
    const rankings = await getRankings(tryoutId || undefined);
    return { tryouts, rankings };
  }, [tryoutId]);

  const selectedTryout = useMemo(
    () => state.data?.tryouts.find((item) => item.id === tryoutId),
    [state.data?.tryouts, tryoutId],
  );

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Ranking</span>
        <h1>{selectedTryout?.title || 'Peringkat peserta'}</h1>
      </div>
      {state.loading ? <LoadingState title="Memuat ranking" /> : null}
      {state.error ? <ErrorState title="Ranking gagal dimuat" description={state.error} /> : null}
      {state.data ? (
        <>
          <select value={tryoutId} onChange={(event) => setTryoutId(event.target.value)}>
            <option value="">Semua tryout</option>
            {state.data.tryouts.map((tryout) => (
              <option key={tryout.id} value={tryout.id}>
                {tryout.title}
              </option>
            ))}
          </select>
          <div className="panel">
            <div className="table">
              <div className="table-row table-head">
                <span>Rank</span>
                <span>Peserta</span>
                <span>Skor</span>
              </div>
              {state.data.rankings.map((ranking) => (
                <div className="table-row" key={ranking.id}>
                  <span>#{ranking.rank}</span>
                  <span>Peserta {ranking.legacy_user_id ?? ranking.profile_id?.slice(0, 8)}</span>
                  <strong>{scoreLabel(ranking.total_score)}</strong>
                </div>
              ))}
            </div>
            {state.data.rankings.length === 0 ? (
              <EmptyState title="Belum ada ranking" />
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
};
