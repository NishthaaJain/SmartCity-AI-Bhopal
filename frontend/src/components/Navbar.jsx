import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, PlusCircle, UserCheck, LayoutDashboard, ClipboardList, Users } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
        isActive(to)
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </Link>
  );

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-wide">SmartCity<span className="text-blue-600">.AI</span></span>
              <span className="block text-xs text-slate-500 font-medium">Bhopal Civic Issue Management</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              {user.role === 'SUPER_ADMIN' && (
                <>
                  <NavLink to="/admin/super" icon={LayoutDashboard}>Dashboard</NavLink>
                  <NavLink to="/admin/super/departments" icon={Building2}>Departments</NavLink>
                  <NavLink to="/admin/super/users" icon={Users}>Admin Users</NavLink>
                </>
              )}
              {user.role === 'DEPARTMENT_ADMIN' && (
                <>
                  <NavLink to="/admin" icon={LayoutDashboard}>Dashboard</NavLink>
                  <NavLink to="/admin/complaints" icon={ClipboardList}>Complaints</NavLink>
                </>
              )}
              {(user.role === 'CITIZEN' || !['SUPER_ADMIN', 'DEPARTMENT_ADMIN'].includes(user.role)) && (
                <>
                  <NavLink to="/citizen" icon={UserCheck}>My Complaints</NavLink>
                  <NavLink to="/new-complaint" icon={PlusCircle}>Report Issue</NavLink>
                </>
              )}
            </div>
          )}

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-semibold text-slate-700">{user.name}</span>
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
