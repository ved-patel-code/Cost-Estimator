import React from 'react';
import { Link } from 'react-router-dom'; // <--- Import Link
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      
      {/* Logo Area - Clickable Link to Dashboard */}
      <Link 
        to="/dashboard" 
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <h1 className="text-xl font-bold text-primary hidden sm:block">Cost Estimator</h1>
      </Link>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={18} />
          <span className="font-medium hidden sm:block">{user?.username}</span>
        </div>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button 
          onClick={logout} 
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;