import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiShoppingCart,
  FiBox,
  FiSettings,
  FiChevronRight,
  FiDisc,
  FiX,
} from 'react-icons/fi';
import logoImg from '../../assets/logo.png';

export default function Sidebar({ isOpen, isCollapsed, onCloseMobile }) {
  const location = useLocation();

  // Dynamic company logo from System Settings (with fallback to default logo)
  const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('company_logo') || '');

  useEffect(() => {
    const handleLogoUpdate = () => {
      setCompanyLogo(localStorage.getItem('company_logo') || '');
    };

    window.addEventListener('company-logo-updated', handleLogoUpdate);

    // Initial fetch if not cached in localStorage
    if (!localStorage.getItem('company_logo')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      fetch(`${apiBase}/api/v1/company`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (result?.data?.logo) {
            localStorage.setItem('company_logo', result.data.logo);
            setCompanyLogo(result.data.logo);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('company-logo-updated', handleLogoUpdate);
    };
  }, []);

  // Track accordion state for expandable menus
  const [openMenus, setOpenMenus] = useState({
    sales: false,
    inventory: false,
    settings: false,
  });

  // Automatically expand parent menu if current route is one of its children
  useEffect(() => {
    const path = location.pathname;
    setOpenMenus((prev) => ({
      ...prev,
      sales: prev.sales || path.startsWith('/sales'),
      inventory: prev.inventory || path.startsWith('/inventory'),
      settings: prev.settings || path.startsWith('/settings'),
    }));
  }, [location.pathname]);

  const toggleMenu = (menuKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  // Light, neat, Dreams POS style selected menu item
  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 select-none ${
      isActive
        ? 'bg-[#FFF5EC] text-[#FE9F43] border border-[#FFE7D3] font-bold shadow-2xs'
        : 'text-[#646B72] hover:text-[#212B36] hover:bg-gray-100/70 border border-transparent'
    }`;

  const subNavItemClass = ({ isActive }) =>
    `flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 select-none ${
      isActive
        ? 'text-[#FE9F43] bg-[#FFF5EC] font-bold'
        : 'text-[#646B72] hover:text-[#212B36] hover:bg-gray-100/60'
    }`;

  const isMenuChildActive = (prefix) => location.pathname.startsWith(prefix);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Aside (Compact width: 236px desktop) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[76px]' : 'w-[236px]'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="h-[70px] px-4 border-b border-gray-100 flex items-center justify-between">
          <NavLink
            to="/dashboard"
            className="flex items-center justify-center w-full overflow-hidden"
          >
            {isCollapsed ? (
              // Collapsed mode: Show only favicon icon
              <img
                src="/Bgrem-favicon.png"
                alt="Favicon"
                className="w-8 h-8 object-contain select-none"
              />
            ) : (
              // Open mode: Show official company logo from settings (Clean without extra text)
              <div className="flex items-center justify-center w-full py-1">
                <img
                  src={companyLogo || logoImg}
                  alt="AVS Crackers"
                  className="h-11 max-w-[180px] object-contain select-none transition-transform hover:scale-102"
                />
              </div>
            )}
          </NavLink>

          {/* Close button on mobile screen */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#646B72] hover:text-[#212B36] hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <FiX className="text-[18px]" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-1">
          {/* Section: Main Menu Label */}
          {!isCollapsed && (
            <div className="px-2.5 pt-1.5 pb-1 text-[10.5px] font-bold text-[#646B72]/60 uppercase tracking-wider">
              Main Menu
            </div>
          )}

          {/* 1. Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className={navItemClass}
            title="Dashboard"
          >
            <FiGrid className="text-[18px] shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* 2. Sales (Collapsible with smooth animation) */}
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('sales')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer border ${
                isMenuChildActive('/sales')
                  ? 'bg-[#FFF5EC] text-[#FE9F43] border-[#FFE7D3] font-bold'
                  : 'text-[#646B72] hover:text-[#212B36] hover:bg-gray-100/70 border-transparent'
              }`}
              title="Sales"
            >
              <div className="flex items-center gap-3">
                <FiShoppingCart className="text-[18px] shrink-0" />
                {!isCollapsed && <span>Sales</span>}
              </div>
              {!isCollapsed && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isMenuChildActive('/sales')
                      ? 'bg-[#FE9F43] text-white shadow-2xs'
                      : 'bg-gray-100 text-[#646B72]'
                  }`}
                >
                  <FiChevronRight
                    className={`text-[12px] transition-transform duration-300 ease-in-out ${
                      openMenus.sales ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                </span>
              )}
            </button>

            {/* Smooth Submenu Slide Down Container */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                !isCollapsed && openMenus.sales
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden space-y-1 pl-1 pt-1">
                <NavLink
                  to="/sales/outward"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>Outward</span>
                </NavLink>

                <NavLink
                  to="/sales/outward-list"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>Outward List</span>
                </NavLink>
              </div>
            </div>
          </div>

          {/* 3. Inventory (Collapsible with smooth animation) */}
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer border ${
                isMenuChildActive('/inventory')
                  ? 'bg-[#FFF5EC] text-[#FE9F43] border-[#FFE7D3] font-bold'
                  : 'text-[#646B72] hover:text-[#212B36] hover:bg-gray-100/70 border-transparent'
              }`}
              title="Inventory"
            >
              <div className="flex items-center gap-3">
                <FiBox className="text-[18px] shrink-0" />
                {!isCollapsed && <span>Inventory</span>}
              </div>
              {!isCollapsed && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isMenuChildActive('/inventory')
                      ? 'bg-[#FE9F43] text-white shadow-2xs'
                      : 'bg-gray-100 text-[#646B72]'
                  }`}
                >
                  <FiChevronRight
                    className={`text-[12px] transition-transform duration-300 ease-in-out ${
                      openMenus.inventory ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                </span>
              )}
            </button>

            {/* Smooth Submenu Slide Down Container */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                !isCollapsed && openMenus.inventory
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden space-y-1 pl-1 pt-1">
                <NavLink
                  to="/inventory/category"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>Category</span>
                </NavLink>

                <NavLink
                  to="/inventory/create-product"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>Create Product</span>
                </NavLink>

                <NavLink
                  to="/inventory/products"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>All Products</span>
                </NavLink>
              </div>
            </div>
          </div>

          {/* 4. Settings (Collapsible with smooth animation) */}
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer border ${
                isMenuChildActive('/settings')
                  ? 'bg-[#FFF5EC] text-[#FE9F43] border-[#FFE7D3] font-bold'
                  : 'text-[#646B72] hover:text-[#212B36] hover:bg-gray-100/70 border-transparent'
              }`}
              title="Settings"
            >
              <div className="flex items-center gap-3">
                <FiSettings className="text-[18px] shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </div>
              {!isCollapsed && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isMenuChildActive('/settings')
                      ? 'bg-[#FE9F43] text-white shadow-2xs'
                      : 'bg-gray-100 text-[#646B72]'
                  }`}
                >
                  <FiChevronRight
                    className={`text-[12px] transition-transform duration-300 ease-in-out ${
                      openMenus.settings ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                </span>
              )}
            </button>

            {/* Smooth Submenu Slide Down Container */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                !isCollapsed && openMenus.settings
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden space-y-1 pl-1 pt-1">
                <NavLink
                  to="/settings/profile"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>Profile Settings</span>
                </NavLink>

                <NavLink
                  to="/settings/system"
                  onClick={onCloseMobile}
                  className={subNavItemClass}
                >
                  <FiDisc className="text-[8px] shrink-0 opacity-70" />
                  <span>System Settings</span>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
