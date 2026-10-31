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
    const { user, isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth, logout } = useAuth();
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
            const roleLabels = {
                admin: "Quản trị viên (Admin)",
                landlord: "Chủ trọ (Landlord)",
                employee: "Nhân viên hỗ trợ",
                student: "Người thuê / Sinh viên"
            };
            const currentRoleLabel = roleLabels[user.role] || user.role;
            const requiredRolesLabel = requiredRoles.map(r => roleLabels[r] || r).join(", ");

            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mb-4 shadow-sm">
                        ⛔
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Quyền truy cập bị từ chối</h2>
                    <p className="text-sm text-slate-600 max-w-md mb-2">
                        Tài khoản hiện tại của bạn là <span className="font-semibold text-rose-600">{currentRoleLabel}</span>.
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mb-6">
                        Phân hệ này yêu cầu quyền: <span className="font-medium text-slate-700">{requiredRolesLabel}</span>.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {(user.role === 'landlord' || user.role === 'employee') && (
                            <a 
                                href="/chu-tro" 
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
                            >
                                Vào Kênh Quản lý Chủ trọ
                            </a>
                        )}
                        {user.role === 'admin' && (
                            <a 
                                href="/admin" 
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
                            >
                                Vào Trang Quản trị (Admin)
                            </a>
                        )}
                        <a 
                            href="/" 
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                        >
                            Về trang chủ
                        </a>
                        <button 
                            type="button"
                            onClick={() => logout(true)} 
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-xs cursor-pointer"
                        >
                            Đăng xuất / Đổi tài khoản
                        </button>
                    </div>
                </div>
            );
        }
    }

    return children ? children : <Outlet />;
}
