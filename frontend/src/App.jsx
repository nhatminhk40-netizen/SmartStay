import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
// Add page imports here
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Admin from '@/pages/Admin';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
      <Route
        path="/admin"
        element={
          !isAuthenticated ? (
            <Navigate to="/login?returnTo=/admin" replace />
          ) : user?.role === 'admin' ? (
            <Admin />
          ) : (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-xl">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">⚠️</div>
                <h2 className="text-lg font-bold font-display text-slate-900 mb-2">Quyền truy cập bị từ chối</h2>
                <p className="text-xs text-slate-500 mb-6">Trang này chỉ dành riêng cho tài khoản Quản trị viên (Admin). Bạn hiện đang đăng nhập với vai trò người dùng bình thường.</p>
                <div className="flex gap-2">
                  <a href="/" className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">Về trang chủ</a>
                  <a href="/login?returnTo=/admin" className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors">Đổi tài khoản Admin</a>
                </div>
              </div>
            </div>
          )
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App