import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <main className="page-content">
    <div className="panel panel--center">
      <span className="eyebrow">404</span>
      <h1>Halaman tidak ditemukan</h1>
      <p>Route lama sudah dibersihkan. Gunakan navigasi baru Supabase-first.</p>
      <Link className="primary-button" to="/">
        Kembali
      </Link>
    </div>
  </main>
);
