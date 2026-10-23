import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500">Đang kiểm tra quyền truy cập...</p>
        </div>
    </div>
);

export default function ProtectedRoute({ 
    fallback = <DefaultFallback />, 
    requiredRoles = [], 
    children 
}) {
    const { user, isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (!authChecked && !isLoadingAuth) {
            checkUserAuth();
        }
    }, [authChecked, isLoadingAuth, checkUserAuth]);

    if (isLoadingAuth || !authChecked) {
        return fallback;
    }

    if (authError && authError.type === 'user_not_registered') {
        return <UserNotRegisteredError />;
    }

    if (!isAuthenticated) {
        const returnParam = location.pathname && location.pathname !== '/' 
            ? `?returnTo=${encodeURIComponent(location.pathname)}` 
            : '';
        return <Navigate to={`/login${returnParam}`} replace />;
    }

    // Kiểm tra Role nếu có yêu cầu
    if (requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.includes(user.role);
        if (!hasRequiredRole) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mb-4">
                        ⛔
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Quyền truy cập bị từ chối</h2>
                    <p className="text-sm text-slate-500 max-w-sm mb-6">
                        Tài khoản của bạn ({user.role}) không có quyền truy cập vào phân hệ này.
                    </p>
                    <a href="/" className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition">
                        Về trang chủ
                    </a>
                </div>
            );
        }
    }

    return children ? children : <Outlet />;
}
