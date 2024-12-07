import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
