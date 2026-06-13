import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <div>Login Page Placeholder</div>,
      }
    ]
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div>Dashboard Placeholder</div>,
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
