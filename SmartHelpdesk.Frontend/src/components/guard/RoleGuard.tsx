import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import React from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to a forbidden page or dashboard if user doesn't have the required role
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
