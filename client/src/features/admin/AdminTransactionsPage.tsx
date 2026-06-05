import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { formatCurrency, formatDate } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';
import type { PaymentStatus } from '../../lib/supabase/database.types';
import {
  listAdminTransactions,
  updateTransactionStatus,
} from './adminRepository';

const statuses: PaymentStatus[] = [
  'pending',
  'checking',
  'paid',
  'rejected',
  'failed',
  'expired',
  'refunded',
];

export const AdminTransactionsPage = () => {
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [error, setError] = useState<string | null>(null);
  const state = useAsync(() => listAdminTransactions(status || undefined), [status]);

  const handleUpdate = async (id: string, paymentStatus: PaymentStatus) => {
    setError(null);
    try {
      await updateTransactionStatus(id, paymentStatus);
      await state.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status gagal diubah');
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Admin</span>
        <h1>Transaksi</h1>
      </div>
      <select value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus | '')}>
        <option value="">Semua status</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {state.loading ? <LoadingState title="Memuat transaksi" /> : null}
      {state.error ? <ErrorState title="Transaksi gagal dimuat" description={state.error} /> : null}
      {error ? <div className="form-error">{error}</div> : null}
      <div className="panel table">
        <div className="table-row table-head">
          <span>Invoice</span>
          <span>Nominal</span>
          <span>Status</span>
          <span>Tanggal</span>
          <span>Aksi</span>
        </div>
        {state.data?.map((transaction) => (
          <div className="table-row" key={transaction.id}>
            <span>{transaction.invoice_number || transaction.kind}</span>
            <strong>{formatCurrency(transaction.amount)}</strong>
            <span>{transaction.payment_status}</span>
            <span>{formatDate(transaction.created_at)}</span>
            <span className="button-row">
              <button
                className="small-button"
                onClick={() => void handleUpdate(transaction.id, 'paid')}
              >
                Paid
              </button>
              <button
                className="small-button"
                onClick={() => void handleUpdate(transaction.id, 'rejected')}
              >
                Tolak
              </button>
            </span>
          </div>
        ))}
      </div>
      {state.data?.length === 0 ? <EmptyState title="Belum ada transaksi" /> : null}
    </section>
  );
};
