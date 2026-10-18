import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    // On mobile devices, toggle drawer
    if (window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      // On desktop, toggle collapsed state
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex font-['Nunito',sans-serif]">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={isMobileOpen}
        isCollapsed={isCollapsed}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />

        {/* Page Content Viewport - Full Width Responsive Layout */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
