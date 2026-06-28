// 顶部导航栏组件
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '内容列表', match: /^\/$/ },
    { path: '/errors', label: '错题本', match: /^\/errors/ },
    { path: '/profile', label: '个人中心', match: /^\/profile/ },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          背诵默写
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                item.match.test(location.pathname)
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-gray-900 hover:text-gray-600"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
