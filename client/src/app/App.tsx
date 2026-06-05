import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, AppLayout, PublicLayout } from './AppLayout';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { AdminQuestionsPage } from '../features/admin/AdminQuestionsPage';
import { AdminTransactionsPage } from '../features/admin/AdminTransactionsPage';
import { AdminTryoutsPage } from '../features/admin/AdminTryoutsPage';
import { AuthPage } from '../features/auth/AuthPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { RankingsPage } from '../features/rankings/RankingsPage';
import { CbtPage } from '../features/tryouts/CbtPage';
import { MyTryoutsPage } from '../features/tryouts/MyTryoutsPage';
import { TryoutDetailPage } from '../features/tryouts/TryoutDetailPage';
import { TryoutStorePage } from '../features/tryouts/TryoutStorePage';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';

export const App = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="tryouts" element={<TryoutStorePage />} />
      <Route path="tryouts/:id" element={<TryoutDetailPage />} />
      <Route path="rankings" element={<RankingsPage />} />
      <Route path="auth" element={<AuthPage />} />
    </Route>

    <Route path="app" element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="tryouts" element={<TryoutStorePage />} />
      <Route path="tryouts/:id" element={<TryoutDetailPage />} />
      <Route path="my-tryouts" element={<MyTryoutsPage />} />
      <Route path="rankings" element={<RankingsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>

    <Route path="admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="tryouts" element={<AdminTryoutsPage />} />
      <Route path="questions" element={<AdminQuestionsPage />} />
      <Route path="transactions" element={<AdminTransactionsPage />} />
    </Route>

    <Route path="start-tryout/:id" element={<CbtPage />} />
    <Route path="dashboard" element={<Navigate to="/app" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
