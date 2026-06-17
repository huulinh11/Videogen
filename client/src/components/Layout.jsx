import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Studio', icon: '🎬' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/account', label: 'Account', icon: '🔑' },
  { to: '/api-test', label: 'API Test', icon: '🧪' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-radial-glow text-slate-100 flex flex-col">
      {/* Header */}
      <header className="mx-2 sm:mx-4 mt-2 sm:mt-4 mb-2 rounded-2xl bg-glass shadow-2xl sticky top-2 sm:top-4 z-50 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-2xl">🎬</span>
          <h1 className="text-sm sm:text-xl font-bold tracking-tight text-emerald-400">
            Videogen <span className="font-light opacity-60 hidden sm:inline">AI</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
            {user?.username}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden flex justify-center gap-2 px-4 pb-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 bg-white/5'
              }`
            }
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-2 sm:px-4 pb-4">
        <Outlet />
      </main>
    </div>
  );
}
