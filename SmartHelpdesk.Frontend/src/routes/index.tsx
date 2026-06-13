import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { AuthGuard } from "../components/guard/AuthGuard";
import { GuestGuard } from "../components/guard/GuestGuard";
import { RoleGuard } from "../components/guard/RoleGuard";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: (
      <GuestGuard>
        <AuthLayout />
      </GuestGuard>
    ),
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      }
    ]
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <div>Dashboard Content Placeholder</div>,
      },
      {
        path: "tickets",
        element: <div>Tickets Page Placeholder</div>,
      },
      {
        path: "users",
        element: (
          <RoleGuard allowedRoles={["Admin"]}>
            <div>Users Management Placeholder</div>
          </RoleGuard>
        ),
      }
    ]
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-3xl font-bold text-red-600">404 Not Found</h1>
      </div>
    ),
  },
]);
