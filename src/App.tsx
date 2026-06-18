import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/useAuth';
import BackgroundGlow from './components/ui/BackgroundGlow';
import ErrorBoundary from './components/ui/ErrorBoundary';
import SetupRequired from './components/ui/SetupRequired';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import Profile from './pages/Profile';
import Learn from './pages/Learn';
import Login from './pages/Login';
import Apply from './pages/Apply';
import ResumeBuilder from './pages/ResumeBuilder';
import GapAnalyzer from './pages/GapAnalyzer';
import Challenge from './pages/Challenge';

const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
      <BackgroundGlow />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse-slow">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/skills" element={user ? <Skills /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      <Route path="/learn" element={user ? <Learn /> : <Navigate to="/login" replace />} />
      <Route path="/audit" element={<Navigate to="/learn?tab=audit" replace />} />
      <Route path="/apply" element={user ? <Apply /> : <Navigate to="/login" replace />} />
      <Route path="/apply/resume" element={user ? <ResumeBuilder /> : <Navigate to="/login" replace />} />
      <Route path="/apply/gaps" element={user ? <GapAnalyzer /> : <Navigate to="/login" replace />} />
      <Route path="/challenge" element={user ? <Challenge /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
