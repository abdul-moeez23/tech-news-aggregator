import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import LogoutModal from './LogoutModal';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const location = useLocation();

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border-subtle bg-bg-primary flex flex-col fixed md:sticky top-0 h-screen z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <span className="text-[#FAFAFA] font-bold text-lg leading-none">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">TechPulse</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-3">Menu</div>
          <Link to="/dashboard" className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-bg-card-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'}`}>
            Home
          </Link>
          
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mt-8 mb-2 px-3">Library</div>
          <Link to="/sources" className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/sources' ? 'bg-bg-card-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'}`}>
            Sources
          </Link>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <Link to="/settings" className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/settings' ? 'bg-bg-card-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'}`}>
            Settings
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-text-secondary hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="flex-1 max-w-xl relative hidden sm:block">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Search technology news..." 
              className="w-full bg-bg-card border border-border-subtle rounded-full py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <button className="text-text-secondary hover:text-text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-cyan to-accent-blue cursor-pointer ring-2 ring-border-subtle"></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={confirmLogout} 
      />
    </div>
  );
}
