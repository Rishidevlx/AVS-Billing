import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute: Blocks unauthenticated visitors from accessing internal pages.
 * Redirects directly to /login if no valid auth token is present.
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * PublicRoute: Prevents logged-in users from seeing the /login page again.
 * Redirects directly to /dashboard if an auth token is already present.
 */
export function PublicRoute({ children }) {
  const token = localStorage.getItem('auth_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
