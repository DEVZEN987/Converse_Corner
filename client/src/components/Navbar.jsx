import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const initial = (user?.username || user?.email || '?')[0]?.toUpperCase();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      <Link
        to="/"
        className="text-[1.35rem] font-bold tracking-tight text-indigo-500 hover:text-indigo-600 transition-colors"
      >
        Converse Corner
      </Link>

      <div className="flex items-center gap-1">
        <Link
          to="/"
          className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
        >
          Home
        </Link>
        <Link
          to="/browse-skill"
          className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
        >
          Browse Skills
        </Link>
        <Link
          to="/about"
          className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
        >
          About
        </Link>

        {user && (
          <>
            <Link
              to="/dashboard"
              className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/messages"
              className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Messages
            </Link>
          </>
        )}

        {/* Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-2 flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500 text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-600 transition-colors"
          >
            {/* Simple profile icon */}
            <span className="text-sm font-semibold">{initial}</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 shadow-xl border border-slate-100/90 backdrop-blur-sm z-20 overflow-hidden">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                      Signed in as
                    </p>
                    <div className="mt-0.5 text-slate-900 text-sm font-semibold truncate">
                      {user.username || user.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/profile')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/add-skill')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    Add Skill
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50/80 border-t border-slate-100 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/login')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/register')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
