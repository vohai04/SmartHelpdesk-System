import { createBrowserRouter, Navigate } from "react-router-dom";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UsersPage } from "../pages/dashboard/UsersPage";
import { CategoriesPage } from "../pages/admin/CategoriesPage";
import { AuditLogsPage } from "../pages/admin/AuditLogsPage";
import { SettingsPage } from "../pages/dashboard/SettingsPage";
import { TicketsPage } from "../pages/dashboard/TicketsPage";
import { TicketDetailPage } from "../pages/dashboard/TicketDetailPage";
import { AuthGuard } from "../components/guard/AuthGuard";
import { GuestGuard } from "../components/guard/GuestGuard";
import { RoleGuard } from "../components/guard/RoleGuard";

// ─── 404 Page ─────────────────────────────────────────────────────────────────
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
      { index: true,       element: <DashboardPage /> },
      { path: "tickets",   element: <TicketsPage /> },
      { path: "tickets/:id", element: <TicketDetailPage /> },
      { path: "profile",   element: <Navigate to="/settings" replace /> },
      { path: "settings", element: <SettingsPage /> },
      {
        path: "users",
        element: (
          <RoleGuard allowedRoles={["Admin"]}>
            <UsersPage />
          </RoleGuard>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <RoleGuard allowedRoles={["Admin"]}>
            <CategoriesPage />
          </RoleGuard>
        ),
      },
      {
        path: "admin/audit-logs",
        element: (
          <RoleGuard allowedRoles={["Admin"]}>
            <AuditLogsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
