import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UsersPage } from "../pages/dashboard/UsersPage";
import { ProfilePage } from "../pages/dashboard/ProfilePage";
import { AuthGuard } from "../components/guard/AuthGuard";
import { GuestGuard } from "../components/guard/GuestGuard";
import { RoleGuard } from "../components/guard/RoleGuard";

// ─── 404 Page ─────────────────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="text-[64px] font-bold text-gray-900 leading-none tracking-tight">404</h1>
        <p className="text-[16px] font-semibold text-gray-700 mt-3">Page not found</p>
        <p className="text-[13px] text-gray-400 mt-2 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 mt-6 h-[38px] px-5 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-medium rounded-lg transition-all shadow-sm"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: "/auth",
    element: (
      <GuestGuard>
        <AuthLayout />
      </GuestGuard>
    ),
    children: [
      { path: "login",    element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "tickets", element: <div className="animate-fade-in flex items-center justify-center py-20 text-gray-400 text-[14px]">Tickets page — coming soon</div> },
      { path: "profile", element: <ProfilePage /> },
      {
        path: "users",
        element: (
          <RoleGuard allowedRoles={["Admin"]}>
            <UsersPage />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
