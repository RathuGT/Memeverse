'use client';

import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface ValidationErrors {
  email?: string | null;
  password?: string | null;
  general?: string | null;
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // Form validation and security states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Refs
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus on email input when page loads
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  // Real-time validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email && value) {
      const emailError = validateEmail(value);
      if (!emailError) {
        setErrors(prev => ({ ...prev, email: null }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password && value) {
      const passwordError = validatePassword(value);
      if (!passwordError) {
        setErrors(prev => ({ ...prev, password: null }));
      }
    }
  };

  // Security: Rate limiting
  const checkRateLimit = () => {
    if (loginAttempts >= 5) {
      setIsBlocked(true);
      setTimeout(() => {
        setIsBlocked(false);
        setLoginAttempts(0);
      }, 15000); // 15 second lockout
      return false;
    }
    return true;
  };

  // Enhanced login handler with Supabase integration
  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    // Check rate limiting
    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait 15 seconds." });
      return;
    }

    setIsLoading(true);

    try {
      // Attempt Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Success - reset attempts and redirect
        setLoginAttempts(0);
        console.log('Login successful:', data.user);
        
        // Redirect to main page or dashboard
        router.push('/');
      }

    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle specific Supabase error messages
      let friendlyMessage = "Login failed. Please try again.";
      if (errorMessage.includes("Invalid login credentials")) {
        friendlyMessage = "Invalid email or password";
      } else if (errorMessage.includes("Email not confirmed")) {
        friendlyMessage = "Please confirm your email before logging in";
      } else if (errorMessage.includes("Too many requests")) {
        friendlyMessage = "Too many login attempts. Please wait before trying again.";
      }
      
      setErrors({ general: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait." });
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // The redirect will happen automatically
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setErrors({ general: `Google login failed: ${errorMessage}` });
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={handleGoBack}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
          aria-label="Go back to main page"
        >
          <X size={24} />
        </button>

        {/* Header with speech bubble */}
        <div className="relative mb-8">
          <div className="bg-white border-2 border-gray-300 rounded-2xl px-4 py-2 inline-block relative">
            <span className="font-semibold text-gray-800">MemeVerse</span>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-300"></div>
            <div className="absolute -bottom-1 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
          Let's start meming
        </h1>

        {/* General Error Message */}
        {errors.general && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errors.general}</span>
          </div>
        )}

        {/* Rate Limiting Warning */}
        {isBlocked && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Account temporarily locked. Please wait 15 seconds.</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} noValidate>
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                ref={firstInputRef}
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading || isBlocked}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-gray-700 text-white' 
                    : 'border-gray-300 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400'
                } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                placeholder="Enter your email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading || isBlocked}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 transition-colors ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-gray-700 text-white' 
                      : 'border-gray-300 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400'
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isBlocked}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button 
                type="button"
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Forgotten your password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || isBlocked}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="my-6 text-center">
          <span className="text-gray-500 text-sm">OR</span>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading || isBlocked}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-3 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            By signing up, you agree to the{' '}
            <button className="underline hover:text-gray-700">Terms of Service</button>{' '}
            and acknowledge that you've read our{' '}
            <button className="underline hover:text-gray-700">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}