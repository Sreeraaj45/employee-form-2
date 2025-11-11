import { useState, useEffect } from 'react';
import EmployeeForm from './components/EmployeeForm';
import DeveloperDashboard from './components/DeveloperDashboard';
import Login from './components/Login';
import { Code2, Users } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<'employee' | 'developer' | 'login'>('employee');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('user_email');
    if (token && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
    }

    const p = window.location.pathname;
    setPathname(p);
    if (p === '/form') setCurrentPage('employee');
    else if (p === '/dashboard') {
      if (token && email) {
        setCurrentPage('developer');
      } else {
        setCurrentPage('login');
      }
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname;
      setPathname(p);
      if (p === '/form') setCurrentPage('employee');
      else if (p === '/dashboard') {
        if (isAuthenticated) {
          setCurrentPage('developer');
        } else {
          setCurrentPage('login');
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'e') {
        navigateTo('employee');
      } else if (e.altKey && e.key === 'd') {
        if (isAuthenticated) {
          navigateTo('developer');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const navigateTo = (page: 'employee' | 'developer') => {
    setCurrentPage(page);
    const newPath = page === 'employee' ? '/form' : '/dashboard';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
      setPathname(newPath);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const email = localStorage.getItem('user_email') || '';
    setUserEmail(email);
    setCurrentPage('developer');
    window.history.pushState({}, '', '/dashboard');
    setPathname('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
    setUserEmail('');
    setCurrentPage('employee');
    window.history.pushState({}, '', '/form');
    setPathname('/form');
  };

  const isDirectPath = pathname === '/form' || pathname === '/dashboard' || pathname === '/login';

  if (currentPage === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* {!isDirectPath && (
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">Form Portal</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('employee')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    currentPage === 'employee'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users size={20} />
                  Employee Form
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => navigateTo('developer')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      currentPage === 'developer'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Code2 size={20} />
                    Developer Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      )} */}

      {currentPage === 'employee' && <EmployeeForm />}
      {currentPage === 'developer' && (
        <DeveloperDashboard userEmail={userEmail} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
