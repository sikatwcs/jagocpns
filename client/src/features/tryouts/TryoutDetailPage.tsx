import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useAuth } from '../auth/AuthProvider';
import { formatCurrency } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';
import {
  createCheckoutTransaction,
  getTryoutById,
  getTryoutQuestions,
  startAttempt,
} from './tryoutRepository';

export const TryoutDetailPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const detail = useAsync(async () => {
    if (!id) return null;
    const [tryout, questions] = await Promise.all([
      getTryoutById(id),
      getTryoutQuestions(id),
    ]);
    return { tryout, questions };
  }, [id]);

  if (detail.loading) return <LoadingState title="Memuat detail tryout" />;
  if (detail.error) return <ErrorState title="Detail gagal dimuat" description={detail.error} />;
  if (!detail.data?.tryout) return <EmptyState title="Tryout tidak ditemukan" />;

  const { tryout, questions } = detail.data;

  const handleAction = async () => {
    setBusy(true);
    setMessage(null);
    setActionError(null);
    try {
      if (!profile || !user) {
        setActionError('Masuk akun Supabase dahulu.');
        return;
      }
      if (tryout.price > 0) {
        const transaction = await createCheckoutTransaction(profile, tryout);
        setMessage(
          `Invoice ${transaction.invoice_number} dibuat. Admin perlu konfirmasi pembayaran dari Supabase.`,
        );
      } else {
        await startAttempt(profile, tryout.id);
        setMessage('Akses tryout gratis dibuat. Silakan mulai pengerjaan.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Aksi gagal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="stack">
      <div className="detail-header">
        <div>
          <span className="eyebrow">{tryout.type} Batch {tryout.batch}</span>
          <h1>{tryout.title}</h1>
          <p>{tryout.description || 'Detail paket tryout Jago CPNS.'}</p>
        </div>
        <div className="price-box">
          <span>Harga</span>
          <strong>{formatCurrency(tryout.price)}</strong>
        </div>
      </div>

      <div className="two-column">
        <div className="panel">
          <h2>Informasi</h2>
          <div className="data-grid">
            <span>Jumlah soal</span>
            <strong>{questions.length || tryout.total_questions}</strong>
            <span>Durasi</span>
            <strong>{tryout.duration_minutes} menit</strong>
            <span>Status</span>
            <strong>{tryout.is_online ? 'Online' : 'Offline'}</strong>
          </div>
          <div className="button-row">
            <button className="primary-button" disabled={busy} onClick={handleAction}>
              {busy ? 'Memproses...' : tryout.price > 0 ? 'Buat invoice' : 'Ambil gratis'}
            </button>
            <Link className="secondary-button" to={`/start-tryout/${tryout.id}`}>
              Mulai CBT
            </Link>
          </div>
          {message ? <div className="form-success">{message}</div> : null}
          {actionError ? <div className="form-error">{actionError}</div> : null}
        </div>

        <div className="panel">
          <h2>Komposisi soal</h2>
          <div className="data-grid">
            {['TWK', 'TIU', 'TKP', 'OTHER'].map((category) => (
              <div key={category} className="data-row">
                <span>{category}</span>
                <strong>
                  {questions.filter((question) => question.category === category).length}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
