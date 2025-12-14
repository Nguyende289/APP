
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../constants';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
  onOpenSettings?: () => void; // New prop for opening settings
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, onOpenSettings }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-gradient-to-br from-gray-900 to-blue-950 text-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-72'}
        `}
      >
        {/* Header / Logo */}
        <div className={`flex items-center h-20 px-4 border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 overflow-hidden whitespace-nowrap">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <span className="text-xl font-bold tracking-wide">Police App</span>
            </div>
          ) : (
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          )}
          
          {/* Close button for mobile */}
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`group flex items-center p-3 rounded-xl transition-all duration-200 relative
                  ${isActive 
                    ? 'bg-blue-600 shadow-lg text-white' 
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`}>
                  <span dangerouslySetInnerHTML={{ __html: item.icon }} className="block w-6 h-6" />
                </div>
                
                {!isCollapsed && (
                  <span className="ml-3 font-medium whitespace-nowrap overflow-hidden text-sm">
                    {item.name}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
                
                {/* Active Indicator for collapsed state */}
                {isCollapsed && isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-300 rounded-r-full -ml-3" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Toggle Button */}
        <div className="p-4 border-t border-white/10 space-y-2">
            {/* Google Sheets Settings Button */}
             <button
                onClick={onOpenSettings}
                className={`w-full flex items-center p-2 rounded-lg text-green-300 hover:bg-white/10 hover:text-green-100 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                title="Kết nối Google Sheets"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                {!isCollapsed && <span className="ml-3 font-medium text-sm">Đồng bộ Google Sheets</span>}
            </button>


          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full items-center justify-center p-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                <span className="text-sm font-medium">Thu gọn menu</span>
              </div>
            )}
          </button>
          
          {!isCollapsed && (
            <div className="mt-4 text-center text-xs text-blue-300/60">
              <p>© 2024 Police Management</p>
              <p>v1.0.0 (Stable)</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
