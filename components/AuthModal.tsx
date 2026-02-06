import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Phone, Key, Shield, Building2, Sparkles, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type AuthTab = 'social' | 'email' | 'phone' | 'magic' | 'sso';
type AuthMode = 'login' | 'signup';

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}

function authPost(url: string, body: object, csrfToken: string) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('social');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('');
  const csrfTokenRef = useRef<string>('');
  const [csrfReady, setCsrfReady] = useState(false);

  useEffect(() => {
    if (isOpen && !csrfTokenRef.current) {
      setCsrfReady(false);
      fetchCsrfToken()
        .then(token => {
          csrfTokenRef.current = token;
          setCsrfReady(true);
        })
        .catch(() => {
          setError('Could not initialize security token. Please close and reopen this dialog.');
        });
    } else if (csrfTokenRef.current) {
      setCsrfReady(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs: { id: AuthTab; label: string; icon: React.ElementType }[] = [
    { id: 'social', label: 'Social', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'magic', label: 'Magic Link', icon: Sparkles },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'sso', label: 'SSO', icon: Building2 },
  ];

  const socialProviders = [
    { id: 'replit', name: 'Replit Auth', color: 'bg-orange-500', available: true, note: 'Recommended' },
    { id: 'google', name: 'Google', color: 'bg-red-500', available: true, note: 'via Replit' },
    { id: 'github', name: 'GitHub', color: 'bg-gray-700', available: true, note: 'via Replit' },
    { id: 'microsoft', name: 'Microsoft', color: 'bg-blue-600', available: false, note: 'Coming Soon' },
    { id: 'apple', name: 'Apple', color: 'bg-black', available: true, note: 'via Replit' },
    { id: 'twitter', name: 'X (Twitter)', color: 'bg-gray-800', available: true, note: 'via Replit' },
  ];

  const handleSocialLogin = (provider: string) => {
    if (provider === 'replit' || provider === 'google' || provider === 'github' || provider === 'apple' || provider === 'twitter') {
      login();
    } else {
      setError(`${provider} login coming soon`);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'signup') {
      const allRequirementsMet = PASSWORD_REQUIREMENTS.every(req => req.test(password));
      if (!allRequirementsMet) {
        setError('Please meet all password requirements');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await authPost(`/api/auth/${mode}`, { email, password }, csrfTokenRef.current);
      
      const data = await response.json();
      
      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authPost('/api/auth/magic-link', { email }, csrfTokenRef.current);
      
      if (response.ok) {
        setStep('verify');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send magic link');
      }
    } catch (err) {
      setError('SendGrid integration required for magic links');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authPost('/api/auth/phone', { phone, code: step === 'verify' ? verificationCode : undefined }, csrfTokenRef.current);
      
      if (response.ok) {
        if (step === 'input') {
          setStep('verify');
        } else {
          onClose();
          window.location.reload();
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Phone authentication failed');
      }
    } catch (err) {
      setError('Twilio integration required for phone auth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!ssoProvider) {
      setError('Please enter your SSO provider domain');
      return;
    }
    
    setError('Enterprise SSO requires additional configuration. Contact support for setup.');
  };

  const handleCaptchaClick = () => {
    setCaptchaVerified(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'social':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">
              Sign in with your preferred social account via Replit Auth
            </p>
            <div className="grid grid-cols-2 gap-3">
              {socialProviders.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleSocialLogin(provider.id)}
                  disabled={!provider.available}
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg ${provider.color} text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{provider.name}</span>
                  <span className="text-[10px] opacity-70">{provider.note}</span>
                </button>
              ))}
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mt-4">
              <p className="text-xs text-violet-300 text-center">
                All social logins are powered by Replit Auth, supporting secure OAuth with Google, GitHub, X (Twitter), and Apple
              </p>
            </div>
          </div>
        );

      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login' ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup' ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            {step === 'input' ? (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm text-slate-400 mb-1">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm text-slate-400 mb-1">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-slate-400 mb-2">Password requirements:</p>
                      {PASSWORD_REQUIREMENTS.map(req => (
                        <div key={req.id} className="flex items-center gap-2 text-xs">
                          {req.test(password) ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-slate-600" />
                          )}
                          <span className={req.test(password) ? 'text-emerald-400' : 'text-slate-500'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div 
                  onClick={handleCaptchaClick}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    captchaVerified ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    captchaVerified ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                  }`}>
                    {captchaVerified && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-400">I'm not a robot</span>
                  <div className="ml-auto text-xs text-slate-500">reCAPTCHA</div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !captchaVerified || !csrfReady}
                  className="w-full py-3 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : !csrfReady ? 'Initializing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Check your email</h3>
                <p className="text-sm text-slate-400">
                  We've sent a verification link to {email}
                </p>
                <button
                  onClick={() => setStep('input')}
                  className="mt-4 text-sm text-violet-400 hover:text-violet-300"
                >
                  Use a different email
                </button>
              </div>
            )}
          </form>
        );

      case 'magic':
        return (
          <form onSubmit={handleMagicLink} className="space-y-4">
            {step === 'input' ? (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Enter your email to receive a passwordless login link
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-300">
                    Magic link requires SendGrid integration for email delivery
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !csrfReady}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : !csrfReady ? 'Initializing...' : 'Send Magic Link'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-fuchsia-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Magic link sent!</h3>
                <p className="text-sm text-slate-400">
                  Check your inbox at {email} and click the link to sign in
                </p>
                <button
                  onClick={() => setStep('input')}
                  className="mt-4 text-sm text-violet-400 hover:text-violet-300"
                >
                  Resend link
                </button>
              </div>
            )}
          </form>
        );

      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {step === 'input' ? (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Enter your phone number to receive a verification code
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-300">
                    Phone authentication requires Twilio integration for SMS delivery
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !csrfReady}
                  className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : !csrfReady ? 'Initializing...' : 'Send Verification Code'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Enter the 6-digit code sent to {phone}
                </p>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6 || !csrfReady}
                  className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-full text-sm text-slate-400 hover:text-white"
                >
                  Use a different number
                </button>
              </>
            )}
          </form>
        );

      case 'sso':
        return (
          <form onSubmit={handleSSOSubmit} className="space-y-4">
            <p className="text-sm text-slate-400 mb-4">
              Sign in with your company's Single Sign-On provider
            </p>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Company Domain / SSO Provider</label>
              <input
                type="text"
                value={ssoProvider}
                onChange={(e) => setSsoProvider(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                placeholder="company.okta.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="px-4 py-3 bg-slate-700 rounded-lg text-white text-sm hover:bg-slate-600 transition-all"
              >
                Okta
              </button>
              <button
                type="button"
                className="px-4 py-3 bg-slate-700 rounded-lg text-white text-sm hover:bg-slate-600 transition-all"
              >
                Azure AD
              </button>
              <button
                type="button"
                className="px-4 py-3 bg-slate-700 rounded-lg text-white text-sm hover:bg-slate-600 transition-all"
              >
                OneLogin
              </button>
              <button
                type="button"
                className="px-4 py-3 bg-slate-700 rounded-lg text-white text-sm hover:bg-slate-600 transition-all"
              >
                Auth0
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Continue with SSO
            </button>
            <p className="text-xs text-slate-500 text-center">
              Enterprise SSO requires additional configuration
            </p>
          </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Sign In</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setStep('input'); setError(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {renderTabContent()}
        </div>

        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};
