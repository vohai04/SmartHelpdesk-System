import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import React from "react";

export function GuestGuard({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
