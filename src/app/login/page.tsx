'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { login } from '@/actions/auth';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const isEmailValid = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header with Logo */}
        <div className="p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-linear-to-br from-slate-800 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-700/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900">LMS</span>
              <p className="text-xs text-slate-700">School Management</p>
            </div>
          </div>
        </div>

        {/* Main Content - Centered Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
          <div className="w-full max-w-[420px] space-y-8">
            {/* Welcome Section */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-base text-slate-700">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Login Form */}
            <form action={action} className="space-y-6">
              {/* Error Message */}
              {state?.error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Authentication failed</p>
                    <p className="text-sm text-red-600 mt-0.5">{state.error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-slate-700' : 'text-slate-800'
                    }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-2xl text-slate-900 placeholder-slate-800 text-sm transition-all duration-200 outline-none ${focusedField === 'email'
                      ? 'border-slate-700 bg-white ring-4 ring-slate-700/10'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                    placeholder="name@lms.com"
                  />
                  {isEmailValid && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 animate-in zoom-in duration-200">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    href={ROUTES.FORGOT_PASSWORD}
                    className="text-sm font-medium text-slate-800 hover:text-slate-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-slate-700' : 'text-slate-800'
                    }`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-2xl text-slate-900 placeholder-slate-800 text-sm transition-all duration-200 outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-textfield-decoration-container]:hidden ${focusedField === 'password'
                      ? 'border-slate-700 bg-white ring-4 ring-slate-700/10'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800 hover:text-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    {/* <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white peer-checked:bg-slate-700 peer-checked:border-slate-700 transition-all duration-200 flex items-center justify-center group-hover:border-slate-800">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div> */}
                  </div>
                  {/* <span className="text-sm text-slate-800 group-hover:text-slate-900 transition-colors">
                    Keep me signed in for 30 days
                  </span> */}
                </label>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-linear-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl font-semibold text-base transition-all duration-300 shadow-xl shadow-slate-700/25 hover:shadow-slate-700/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              {/* Sign Up Link */}
              {/* <div className="text-center pt-2">
                <span className="text-sm text-slate-700">Don't have an account? </span>
                <Link 
                  href="#" 
                  className="text-sm font-semibold text-slate-800 hover:text-slate-700 transition-colors hover:underline"
                >
                  Create account
                </Link>
              </div> */}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 lg:p-10">
          <p className="text-sm text-slate-800">
            © {new Date().getFullYear()} LMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-linear-to-br from-slate-700 via-slate-800 to-slate-700 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Large floating circles */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-slate-900/5 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-slate-900/5 animate-pulse" style={{ animationDuration: '5s' }} />

          {/* Smaller decorative circles */}
          <div className="absolute top-[20%] left-[10%] w-24 h-24 rounded-full bg-slate-900/10 blur-xl" />
          <div className="absolute bottom-[30%] right-[15%] w-32 h-32 rounded-full bg-slate-900/10 blur-xl" />
          <div className="absolute top-[60%] left-[30%] w-20 h-20 rounded-full bg-slate-900/5" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* App Icon */}
          <div className="relative mb-8">
            {/* Glow effect */}
            <div className="absolute inset-0 w-40 h-40 rounded-3xl bg-slate-900/30 blur-2xl transform scale-110" />

            {/* Main icon container */}
            <div className="relative w-40 h-40 rounded-3xl bg-slate-900/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-20 h-20 text-white drop-shadow-lg" />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-3 -right-3 px-4 py-2 bg-white rounded-xl shadow-lg">
              <span className="text-sm font-bold text-slate-800">v1.0</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-4 max-w-sm">
            <h2 className="text-3xl font-bold text-white">
              LMS School Management
            </h2>
            <p className="text-lg text-slate-100 leading-relaxed">
              Streamline your educational institution with our comprehensive management solution
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Student Management', 'Fee Tracking', 'Attendance'].map((feature) => (
              <div
                key={feature}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white font-medium"
              >
                {feature}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-sm text-slate-200">Students</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-slate-200">Schools</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">99%</p>
              <p className="text-sm text-slate-200">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
