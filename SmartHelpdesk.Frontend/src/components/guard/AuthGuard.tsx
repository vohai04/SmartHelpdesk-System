import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import React from "react";

export function AuthGuard({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
