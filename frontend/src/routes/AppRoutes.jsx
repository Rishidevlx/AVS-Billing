import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Outward from '../pages/sales/Outward';
import OutwardList from '../pages/sales/OutwardList';
import Category from '../pages/inventory/Category';
import CreateProduct from '../pages/inventory/CreateProduct';
import AllProducts from '../pages/inventory/AllProducts';
import ProfileSettings from '../pages/settings/ProfileSettings';
import SystemSettings from '../pages/settings/SystemSettings';
import ProtectedRoute, { PublicRoute } from '../components/auth/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route (Redirects to /dashboard if already logged in) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Authenticated / App Layout Routes protected by ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Default authenticated route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 1. Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* 2. Sales Routes */}
          <Route path="/sales/outward" element={<Outward />} />
          <Route path="/sales/outward-list" element={<OutwardList />} />

          {/* 3. Inventory Routes */}
          <Route path="/inventory/category" element={<Category />} />
          <Route path="/inventory/create-product" element={<CreateProduct />} />
          <Route path="/inventory/products" element={<AllProducts />} />

          {/* 4. Settings Routes */}
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/settings/system" element={<SystemSettings />} />
        </Route>
      </Route>

      {/* Catch-all Fallback: Redirect to /login if unauthenticated, or /dashboard if authenticated */}
      <Route
        path="*"
        element={
          localStorage.getItem('auth_token') ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
