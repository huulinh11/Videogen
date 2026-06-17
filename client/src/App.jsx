import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StudioPage from './pages/StudioPage';
import AccountPage from './pages/AccountPage';
import HistoryPage from './pages/HistoryPage';
import ApiTestPage from './pages/ApiTestPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudioPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="api-test" element={<ApiTestPage />} />
      </Route>
    </Routes>
  );
}
