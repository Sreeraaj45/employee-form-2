import { useState } from 'react';
import { LogIn, AlertCircle, Loader, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

  const HARDCODED_EMAIL = 'technical_user@ielektron.com';
  const HARDCODED_PASSWORD = 'asdfasdf';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      localStorage.setItem('auth_token', 'authenticated');
      localStorage.setItem('user_email', email);
      setLoading(false);
      onLoginSuccess();
    } else {
      setError('Invalid email or password. Please check your credentials.');
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail(HARDCODED_EMAIL);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-700/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card - Reduced padding */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header Section - Reduced padding */}
          <div className="bg-gradient-to-r from-slate-800 via-purple-800 to-slate-800 px-8 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 mb-3 border border-white/20 shadow-lg">
                <div className="relative">
                  <Shield size={34} className="text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Skill Dashboard
              </h1>
              <p className="text-slate-200/80 text-xs">Authentication required for system access</p>
            </div>
          </div>

          {/* Form Section - Reduced padding */}
          <div className="px-10 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field - Reduced padding */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className={`relative transition-all duration-200 ${isFocused.email ? 'transform scale-[1.02]' : ''}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, email: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, email: false }))}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none bg-white/50 backdrop-blur-sm"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field - Reduced padding */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${isFocused.password ? 'transform scale-[1.02]' : ''}`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 pr-12 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 outline-none bg-white/50 backdrop-blur-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message - Reduced padding */}
              {error && (
                <div className="animate-pulse bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Authentication Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Button - Reduced padding */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-slate-800 to-purple-700 hover:from-slate-900 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Section - Reduced spacing */}
            <div className="mt-4">
              <div className="text-center">
                {/* <button
                  onClick={fillDemoCredentials}
                  disabled={loading}
                  className="bg-gradient-to-r from-gray-500 to-gray-900 hover:from-blue-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mx-auto text-sm"
                >
                  <Sparkles size={14} className="group-hover:scale-110 transition-transform duration-200" />
                  Use Demo Email
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-slate-400 text-xs flex items-center justify-center gap-2">
            <Shield size={12} />
            Developer portal • Restricted access
          </p>
        </div>
      </div>
    </div>
  );
}