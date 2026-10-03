import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { api, GuestProgress } from '../../services/api';
import { User } from '../../types/game';

type AuthView = 'login' | 'register' | 'forgot' | 'reset' | 'otp';

interface AuthModalProps {
  initialView?: AuthView;
  guestProgress: GuestProgress;
  onSuccess: (user: User) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialView = 'login',
  guestProgress,
  onSuccess,
  onClose,
}) => {
  const [view, setView] = useState<AuthView>(initialView);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [simulationCodeNotice, setSimulationCodeNotice] = useState<string | null>(null);

  // Password validation & strength meter calculations
  const passwordCriteria = useMemo(() => {
    const p = view === 'reset' ? newPassword : password;
    const u = username.toLowerCase().trim();
    return {
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
      noUsername: !u || !p.toLowerCase().includes(u),
    };
  }, [password, newPassword, username, view]);

  const strengthScore = useMemo(() => {
    const met = Object.values(passwordCriteria).filter(Boolean).length;
    if (met <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (met <= 4) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (met === 5) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [passwordCriteria]);

  // Client-side live validations
  const isUsernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  // Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isUsernameValid) {
      setErrorMessage('Username must be 3-20 characters (letters, numbers, underscores only).');
      return;
    }
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!Object.values(passwordCriteria).every(Boolean)) {
      setErrorMessage('Please satisfy all password security criteria.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        username,
        email,
        password,
        confirmPassword,
        guestProgress,
      });
      setSuccessMessage('Account created and guest progress migrated! Entering the abyss...');
      setTimeout(() => {
        onSuccess(res.user);
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email && !username) {
      setErrorMessage('Please enter your username or email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login({
        identifier: email || username,
        password,
        rememberMe,
        otp: otpCode || undefined,
      });

      if (res.requiresOtp) {
        setView('otp');
        setSuccessMessage('Two-factor verification required. Enter code 777888 to test.');
        setIsLoading(false);
        return;
      }

      if (res.user) {
        setSuccessMessage('Login successful! Syncing profile...');
        setTimeout(() => {
          onSuccess(res.user!);
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMessage(res.message);
      if (res.simulationCode) {
        setSimulationCodeNotice(`Verification Code: ${res.simulationCode}`);
        setResetCode(res.simulationCode);
      }
      setView('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    if (!Object.values(passwordCriteria).every(Boolean)) {
      setErrorMessage('Please ensure your new password satisfies all criteria.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        email,
        code: resetCode,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setSuccessMessage(res.message);
      setTimeout(() => {
        setView('login');
        setSuccessMessage('Password reset! You can now log in.');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset password failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-950/95 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-chakra tracking-wide">
                {view === 'login' && 'Warrior Sign In'}
                {view === 'register' && 'Forge Account & Save Progress'}
                {view === 'forgot' && 'Recover Access'}
                {view === 'reset' && 'Reset Security Credentials'}
                {view === 'otp' && 'Two-Factor Authentication'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Progress Notice */}
        {guestProgress && (guestProgress.coins > 0 || guestProgress.highScore > 0) && (
          <div className="px-6 py-2.5 bg-cyan-950/40 border-b border-cyan-800/30 flex items-center justify-between text-xs text-cyan-300">
            <span>Guest progress ready to migrate:</span>
            <span className="font-bold tabular-nums">
              {guestProgress.coins} Coins · Score {guestProgress.highScore}
            </span>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {simulationCodeNotice && (
            <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{simulationCodeNotice}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Arjun or arjun@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setView('forgot');
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2 font-chakra"
              >
                {isLoading ? 'Verifying...' : 'Sign In & Enter Game'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2 text-xs text-zinc-400">
                New survivor?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setView('register');
                  }}
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="HeroArjun_99"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                {username && !isUsernameValid && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    3-20 characters: letters, numbers, and underscores only.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@devils-home.com"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars with Aa1#"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">Password Strength</span>
                      <span className={`font-bold ${strengthScore.text}`}>{strengthScore.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full ${
                            step <= strengthScore.score ? strengthScore.color : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-400 pt-1">
                      <span className={passwordCriteria.length ? 'text-emerald-400' : ''}>
                        ✓ 8+ Characters
                      </span>
                      <span className={passwordCriteria.uppercase ? 'text-emerald-400' : ''}>
                        ✓ 1 Uppercase
                      </span>
                      <span className={passwordCriteria.lowercase ? 'text-emerald-400' : ''}>
                        ✓ 1 Lowercase
                      </span>
                      <span className={passwordCriteria.number ? 'text-emerald-400' : ''}>
                        ✓ 1 Number
                      </span>
                      <span className={passwordCriteria.special ? 'text-emerald-400' : ''}>
                        ✓ 1 Special (!@#$)
                      </span>
                      <span className={passwordCriteria.noUsername ? 'text-emerald-400' : ''}>
                        ✓ No Username
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2 font-chakra mt-2"
              >
                {isLoading ? 'Creating Account...' : 'Register & Save Progress'}
              </button>

              <div className="text-center pt-2 text-xs text-zinc-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setView('login');
                  }}
                  className="text-orange-400 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your registered email address. We will generate a verification reset code to
                restore your account.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@devils-home.com"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg font-chakra"
              >
                {isLoading ? 'Sending Code...' : 'Request Reset Code'}
              </button>

              <div className="text-center pt-2 text-xs text-zinc-400">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setView('login');
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Reset Code</label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit reset code"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New secure password"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg font-chakra"
              >
                {isLoading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          )}

          {/* VIEW: TWO-FACTOR OTP */}
          {view === 'otp' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                <ShieldCheck className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-300">
                  Enter the 6-digit authentication token (Demo OTP: <strong className="text-cyan-400">777888</strong>)
                </p>
              </div>

              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                placeholder="777888"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 text-lg font-mono text-center tracking-widest text-cyan-300 focus:outline-none"
              />

              <button
                onClick={handleLogin}
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors font-chakra"
              >
                {isLoading ? 'Verifying OTP...' : 'Verify & Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
