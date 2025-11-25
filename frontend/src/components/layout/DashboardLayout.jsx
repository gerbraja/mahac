import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:block">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-blue-600">TEI Dashboard</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/dashboard" className="block p-3 rounded hover:bg-blue-50 text-gray-700 font-medium">Overview</Link>
          <Link to="/dashboard/wallet" className="block p-3 rounded hover:bg-blue-50 text-gray-700 font-medium">Wallet</Link>
          <Link to="/dashboard/matrix" className="block p-3 rounded hover:bg-blue-50 text-gray-700 font-medium">Matrix Tree</Link>
          <Link to="/dashboard/binary-global" className="block p-3 rounded hover:bg-blue-50 text-gray-700 font-medium">Binary Global</Link>
          <div className="border-t my-2"></div>
          <Link to="/" className="block p-3 rounded hover:bg-gray-50 text-gray-600">Back to Store</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4 flex justify-between items-center md:hidden">
          <h1 className="font-bold">TEI Dashboard</h1>
          {/* Mobile menu button could go here */}
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
