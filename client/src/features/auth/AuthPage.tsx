import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type Mode = 'signin' | 'signup';

export const AuthPage = () => {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp({ email, password, fullName });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Autentikasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Supabase Auth</span>
        <h1>{mode === 'signin' ? 'Masuk' : 'Buat akun'}</h1>
        <p>
          Login sekarang memakai Supabase Auth. Akun lama yang belum diimpor ke
          Auth perlu dibuat ulang atau dimigrasikan batch berikutnya.
        </p>
        {mode === 'signup' ? (
          <label>
            Nama
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
        ) : null}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-button" disabled={loading}>
          {loading ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar'}
        </button>
        <button
          className="link-button"
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Buat akun baru' : 'Sudah punya akun'}
        </button>
      </form>
    </main>
  );
};
