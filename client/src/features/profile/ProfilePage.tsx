import { FormEvent, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useAuth } from '../auth/AuthProvider';
import {
  createTopupTransaction,
  getMyTransactions,
  getWalletBalance,
  transactionStatusLabel,
} from '../tryouts/tryoutRepository';
import { supabase } from '../../lib/supabase/client';
import { formatCurrency, formatDate } from '../../lib/utils/format';
import { useAsync } from '../../lib/utils/useAsync';

export const ProfilePage = () => {
  const { profile, reloadProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [province, setProvince] = useState(profile?.province ?? '');
  const [targetInstansi, setTargetInstansi] = useState(
    profile?.target_instansi ?? '',
  );
  const [amount, setAmount] = useState(50000);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = useAsync(async () => {
    const [balance, transactions] = await Promise.all([
      getWalletBalance(),
      getMyTransactions(),
    ]);
    return { balance, transactions };
  }, [profile?.id]);

  if (!profile) return <LoadingState title="Memuat profil" />;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        province,
        target_instansi: targetInstansi,
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await reloadProfile();
    setMessage('Profil diperbarui.');
  };

  const handleTopup = async () => {
    setError(null);
    setMessage(null);
    try {
      const transaction = await createTopupTransaction(profile, amount);
      setMessage(`Invoice ${transaction.invoice_number} dibuat.`);
      await data.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Top up gagal');
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Profil</span>
        <h1>Data akun</h1>
      </div>
      <div className="two-column">
        <form className="panel form-stack" onSubmit={handleProfileSubmit}>
          <h2>Identitas</h2>
          <label>
            Nama
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label>
            Telepon
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            Provinsi
            <input value={province} onChange={(event) => setProvince(event.target.value)} />
          </label>
          <label>
            Target instansi
            <input
              value={targetInstansi}
              onChange={(event) => setTargetInstansi(event.target.value)}
            />
          </label>
          <button className="primary-button">Simpan profil</button>
          {message ? <div className="form-success">{message}</div> : null}
          {error ? <div className="form-error">{error}</div> : null}
        </form>

        <div className="panel form-stack">
          <h2>Saldo dan top up</h2>
          {data.loading ? <LoadingState title="Memuat saldo" /> : null}
          {data.error ? <ErrorState title="Saldo gagal dimuat" description={data.error} /> : null}
          {data.data ? (
            <>
              <div className="balance-box">{formatCurrency(data.data.balance?.amount)}</div>
              <label>
                Nominal top up
                <input
                  type="number"
                  min={10000}
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </label>
              <button className="secondary-button" onClick={handleTopup}>
                Buat invoice top up
              </button>
              <div className="list">
                {data.data.transactions.slice(0, 6).map((transaction) => (
                  <div className="list-row" key={transaction.id}>
                    <span>{transaction.invoice_number || transaction.kind}</span>
                    <strong>{transactionStatusLabel(transaction.payment_status)}</strong>
                    <small>{formatDate(transaction.created_at)}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Saldo belum tersedia" />
          )}
        </div>
      </div>
    </section>
  );
};
