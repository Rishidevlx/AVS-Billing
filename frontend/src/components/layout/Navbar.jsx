import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMenu,
  FiSearch,
  FiMaximize,
  FiMinimize,
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiSettings,
} from 'react-icons/fi';
import { showConfirm, showToast } from '../../utils/alert';

export default function Navbar({ onToggleSidebar, isSidebarCollapsed }) {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Global Keyboard Shortcut: Ctrl + K or Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Fullscreen toggle using standard browser API
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Sync fullscreen change listener (e.g. if user presses Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle User Logout
  const handleLogout = async () => {
    setIsProfileOpen(false);
    const result = await showConfirm({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out from Rinvox Billing Software?',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      showToast('Logged out successfully', 'info');
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[70px] bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between transition-all select-none">
      {/* Left: Sidebar Toggle & Fixed Width Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl text-[#646B72] hover:text-[#212B36] hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <FiMenu className="text-[20px]" />
        </button>

        {/* Fixed Width Compact Search Bar (Fixed ~280px) */}
        <div className="relative w-64 md:w-72 hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#646B72]">
            <FiSearch className="text-[16px]" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice, product..."
            className="w-full pl-9 pr-14 py-2 bg-[#F7F7F7] border border-transparent hover:border-gray-200 focus:border-[#FE9F43] focus:bg-white focus:outline-none rounded-xl text-[13px] font-medium text-[#212B36] placeholder-[#646B72]/70 transition-all duration-200"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <kbd
              onClick={() => searchInputRef.current?.focus()}
              className="cursor-pointer px-1.5 py-0.5 text-[10px] font-bold text-[#646B72] bg-white border border-gray-200 rounded shadow-2xs hover:border-[#FE9F43] transition-colors"
            >
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions & Admin Profile Badge */}
      <div className="flex items-center gap-1.5 sm:gap-4">
        {/* Fullscreen Button (Hidden on Mobile) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-[#646B72] hover:text-[#212B36] hover:bg-gray-100 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label="Fullscreen Toggle"
        >
          {isFullscreen ? (
            <FiMinimize className="text-[17px]" />
          ) : (
            <FiMaximize className="text-[17px]" />
          )}
        </button>

        {/* Notification Bell with Badge (Count: 2) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => showToast('You have 2 pending low stock alerts', 'info')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#646B72] hover:text-[#212B36] hover:bg-gray-100 transition-colors cursor-pointer relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <FiBell className="text-[18px]" />
            <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 bg-rose-500 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center shadow-xs">
              2
            </span>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>

        {/* Admin Profile Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-gray-100/80 transition-all cursor-pointer group"
          >
            {/* Avatar Circle with Badge */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FE9F43] to-[#ffbe76] p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <FiUser className="text-[18px] text-[#FE9F43]" />
              </div>
            </div>

            {/* Admin Info (Desktop) */}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[13.5px] font-bold text-[#212B36] leading-tight group-hover:text-[#FE9F43] transition-colors">
                Admin
              </span>
              <span className="text-[11px] font-semibold text-[#646B72]">
                Administrator
              </span>
            </div>

            <FiChevronDown
              className={`text-[#646B72] text-[14px] hidden sm:block transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-[13px] font-bold text-[#212B36]">Admin User</p>
                  <p className="text-[11px] text-[#646B72] truncate">admin@gmail.com</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/settings/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#646B72] hover:text-[#FE9F43] hover:bg-[#FFF5EC] rounded-xl transition-colors cursor-pointer"
                  >
                    <FiUser className="text-[15px]" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/settings/system');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#646B72] hover:text-[#FE9F43] hover:bg-[#FFF5EC] rounded-xl transition-colors cursor-pointer"
                  >
                    <FiSettings className="text-[15px]" />
                    <span>System Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <FiLogOut className="text-[15px]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
