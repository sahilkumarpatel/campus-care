
import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const { currentUser, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (currentUser && isAdmin && location.pathname === '/dashboard') {
      navigate('/admin');
    }
  }, [currentUser, isAdmin, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campus-primary"></div>
    </div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-secondary/30">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
