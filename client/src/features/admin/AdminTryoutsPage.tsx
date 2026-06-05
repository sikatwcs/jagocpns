import { FormEvent, useState } from 'react';
import { ErrorState, LoadingState } from '../../components/StateViews';
import { formatCurrency } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';
import { listAdminTryouts, saveTryout } from './adminRepository';
import type { TryoutStatus } from '../../lib/supabase/database.types';

export const AdminTryoutsPage = () => {
  const state = useAsync(listAdminTryouts, []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [batch, setBatch] = useState(1);
  const [type, setType] = useState('Tryout');
  const [status, setStatus] = useState<TryoutStatus>('draft');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await saveTryout({
        title,
        description,
        price,
        batch,
        type,
        status,
        duration_minutes: 120,
        is_online: false,
      });
      setTitle('');
      setDescription('');
      await state.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tryout gagal disimpan');
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Admin</span>
        <h1>Tryout</h1>
      </div>
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Judul
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Tipe
          <input value={type} onChange={(event) => setType(event.target.value)} required />
        </label>
        <label>
          Batch
          <input
            type="number"
            value={batch}
            onChange={(event) => setBatch(Number(event.target.value))}
          />
        </label>
        <label>
          Harga
          <input
            type="number"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as TryoutStatus)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="span-2">
          Deskripsi
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button className="primary-button">Tambah tryout</button>
        {error ? <div className="form-error span-2">{error}</div> : null}
      </form>

      {state.loading ? <LoadingState title="Memuat tryout admin" /> : null}
      {state.error ? <ErrorState title="Gagal memuat" description={state.error} /> : null}
      <div className="panel table">
        <div className="table-row table-head">
          <span>Judul</span>
          <span>Status</span>
          <span>Harga</span>
        </div>
        {state.data?.map((tryout) => (
          <div className="table-row" key={tryout.id}>
            <span>{tryout.title}</span>
            <span>{tryout.status}</span>
            <strong>{formatCurrency(tryout.price)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
};
