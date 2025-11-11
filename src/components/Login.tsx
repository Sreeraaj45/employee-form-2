import { useState } from 'react';
import { LogIn, AlertCircle, Loader } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const HARDCODED_EMAIL = 'technical_user@ielektron.com';
  const HARDCODED_PASSWORD = 'asdfasdf';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      localStorage.setItem('auth_token', 'authenticated');
      localStorage.setItem('user_email', email);
      setLoading(false);
      onLoginSuccess();
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-12">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-white rounded-lg p-2">
                <LogIn size={28} className="text-slate-700" />
              </div>
              <h1 className="text-3xl font-bold text-white">Developer Access</h1>
            </div>
            <p className="text-slate-200 text-center text-sm">Sign in to your dashboard</p>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="technical_user@ielektron.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent transition outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent transition outline-none"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Demo Credentials
              </p>
              <div className="mt-3 space-y-2 bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Email:</span> technical_user@ielektron.com
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Password:</span> asdfasdf
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Access restricted to authorized developers only
        </p>
      </div>
    </div>
  );
}
