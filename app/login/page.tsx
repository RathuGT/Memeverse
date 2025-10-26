'use client';

import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, AlertCircle, User, Mail, Lock } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Type definitions
interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
  created_at?: string;
}

interface ValidationErrors {
  email?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
  username?: string | null;
  general?: string | null;
}

// Database User interface matching your Supabase table
interface DatabaseUser {
  user_id: number;
  username: string;
  password_hash: string;
  email: string;
  role: string;
  created_at: string;
}

// Supabase configuration with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default function AuthPage() {
  // Auth mode state
  const [isSignup, setIsSignup] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  
  // Form validation and security states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Refs
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus on first input when mode changes
  useEffect(() => {
    firstInputRef.current?.focus();
  }, [isSignup]);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/');
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (isSignup && password.length < 8) return "Password must be at least 8 characters for signup";
    if (isSignup && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    return null;
  };

  const validateUsername = (username: string): string | null => {
    if (!isSignup) return null;
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
    return null;
  };

  const validateConfirmPassword = (confirmPassword: string): string | null => {
    if (!isSignup) return null;
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return null;
  };

  // Real-time validation handlers
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
    // Also validate confirm password if it exists
    if (isSignup && confirmPassword && value !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else if (isSignup && confirmPassword && value === confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: null }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (errors.confirmPassword && value) {
      const confirmPasswordError = validateConfirmPassword(value);
      if (!confirmPasswordError) {
        setErrors(prev => ({ ...prev, confirmPassword: null }));
      }
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (errors.username && value) {
      const usernameError = validateUsername(value);
      if (!usernameError) {
        setErrors(prev => ({ ...prev, username: null }));
      }
    }
  };

  // Security: Rate limiting
  const checkRateLimit = (): boolean => {
    if (loginAttempts >= 5) {
      setIsBlocked(true);
      setTimeout(() => {
        setIsBlocked(false);
        setLoginAttempts(0);
      }, 15000);
      return false;
    }
    return true;
  };

  // Create or update user profile in custom users table after auth
  const createOrUpdateUserProfile = async (authUser: any, customUsername?: string) => {
    try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles') // Changed from 'users' to 'user_profiles'
      .select('*')
      .eq('user_id', authUser.id) // Changed from 'email' to 'user_id'
      .single();

    if (existingProfile) {
      console.log('User profile exists:', existingProfile);
      return existingProfile;
    }

    // Create new profile - but the trigger should handle this automatically
    // You might want to remove this manual creation since we have the trigger
    return null; // Let the trigger handle it
  } catch (error) {
    console.error('Error managing user profile:', error);
    return null;
  }
  };

  // Check if username is available
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
    const { data, error } = await supabase
      .from('user_profiles') // Changed from 'users' to 'user_profiles'
      .select('username')
      .eq('username', username)
      .single();

    return !data; // If no data found, username is available
  } catch (error) {
    return true; // Assume available on error
  }
  };

  // Enhanced login handler
  const handleLogin = async () => {
    setErrors({});

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait 15 seconds." });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email: email.trim() });

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error(error.message);
      }

      if (data.user) {
        setLoginAttempts(0);
        console.log('Login successful:', data.user);
        
        try {
          const userProfile = await createOrUpdateUserProfile(data.user);
          if (userProfile) {
            console.log('User profile:', userProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem('userProfile', JSON.stringify(userProfile));
            }
          }
        } catch (profileError) {
          console.warn('Profile fetch failed, but login succeeded:', profileError);
        }

        router.push('/');
      } else {
        throw new Error('No user returned from authentication');
      }

    } catch (error) {
      console.error('Login error:', error);
      setLoginAttempts(prev => prev + 1);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      let friendlyMessage = "Login failed. Please check your credentials and try again.";
      
      if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("invalid_grant")) {
        friendlyMessage = "Invalid email or password. Please check your credentials.";
      } else if (errorMessage.includes("Email not confirmed")) {
        friendlyMessage = "Please confirm your email before logging in.";
      } else if (errorMessage.includes("Too many requests")) {
        friendlyMessage = "Too many login attempts. Please wait before trying again.";
      } else if (errorMessage.includes("User not found")) {
        friendlyMessage = "No account found with this email address.";
      } else if (errorMessage.includes("configuration is missing")) {
        friendlyMessage = "App configuration error. Please try again later.";
      } else if (errorMessage.includes("fetch")) {
        friendlyMessage = "Network error. Please check your connection and try again.";
      }
      
      setErrors({ general: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced signup handler
  const handleSignup = async () => {
    setErrors({});

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    const usernameError = validateUsername(username);

    if (emailError || passwordError || confirmPasswordError || usernameError) {
      setErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        username: usernameError
      });
      return;
    }

    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait 15 seconds." });
      return;
    }

    setIsLoading(true);

    try {
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        setErrors({ username: "Username is already taken" });
        setIsLoading(false);
        return;
      }

      console.log('Attempting signup with:', { email: email.trim(), username });

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            username: username,
          }
        }
      });

      console.log('Supabase signup response:', { data, error });

      if (error) {
        console.error('Supabase signup error:', error);
        throw new Error(error.message);
      }

      if (data.user) {
          setLoginAttempts(0);
          console.log('Signup successful:', data.user);
  
          // Simple manual profile creation - no fancy triggers
          try {
           await supabase
             .from('user_profiles')
              .insert({
                user_id: data.user.id,
                username: username,
                user_type: 'registered'
             });
          } catch (profileError) {
           console.warn('Profile creation failed:', profileError);
           // Don't fail the whole signup for this
          }

        if (!data.session) {
          setErrors({ general: "Signup successful! Please check your email to confirm your account." });
        } else {
         router.push('/');
       }
      }

    } catch (error) {
      console.error('Signup error:', error);
      setLoginAttempts(prev => prev + 1);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      let friendlyMessage = "Signup failed. Please try again.";
      
      if (errorMessage.includes("User already registered")) {
        friendlyMessage = "An account with this email already exists. Please log in instead.";
      } else if (errorMessage.includes("Password should be at least")) {
        friendlyMessage = "Password is too weak. Please choose a stronger password.";
      } else if (errorMessage.includes("Invalid email")) {
        friendlyMessage = "Please enter a valid email address.";
      } else if (errorMessage.includes("configuration is missing")) {
        friendlyMessage = "App configuration error. Please try again later.";
      } else if (errorMessage.includes("fetch")) {
        friendlyMessage = "Network error. Please check your connection and try again.";
      }
      
      setErrors({ general: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Google auth handler
  const handleGoogleAuth = async () => {
    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait." });
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setErrors({ general: `Google authentication failed: ${errorMessage}` });
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ general: "Please enter your email address first" });
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setErrors({ general: `Failed to send reset email: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSignup) {
      handleSignup();
    } else {
      handleLogin();
    }
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setErrors({});
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animated-gradient-bg">
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
            <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-300"></div>
            <div className="absolute -bottom-1 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
          {isSignup ? "Join the meme revolution" : "Let's start meming"}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-sm text-center mb-8">
          {isSignup ? "Create your account to start sharing memes" : "Welcome back to the meme universe"}
        </p>

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

        {/* Auth Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* Username Field (Signup only) */}
            {isSignup && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Username
                </label>
                <input
                  ref={isSignup ? firstInputRef : undefined}
                  type="text"
                  id="username"
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={isLoading || isBlocked}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.username 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-gray-700 text-white' 
                      : 'border-gray-300 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400'
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  placeholder="Choose a unique username"
                  autoComplete="username"
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
                {errors.username && (
                  <p id="username-error" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                ref={!isSignup ? firstInputRef : undefined}
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
                <Lock className="w-4 h-4 inline mr-1" />
                Password
                {isSignup && <span className="text-xs text-gray-500 ml-1">(min 8 chars, mixed case + number)</span>}
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
                  placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
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

            {/* Confirm Password Field (Signup only) */}
            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={isLoading || isBlocked}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 transition-colors ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-gray-700 text-white' 
                        : 'border-gray-300 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400'
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || isBlocked}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Forgot Password Link (Login only) */}
            {!isSignup && (
              <div className="text-right">
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Forgotten your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isBlocked}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isSignup ? 'Creating account...' : 'Logging in...'}
                </>
              ) : (
                isSignup ? 'Create Account' : 'Log in'
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="my-6 text-center">
          <span className="text-gray-500 text-sm">OR</span>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading || isBlocked}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-3 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isSignup ? 'Sign up with Google' : 'Continue with Google'}
        </button>

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleAuthMode}
              disabled={isLoading}
              className="text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            By {isSignup ? 'signing up' : 'logging in'}, you agree to the{' '}
            <button className="underline hover:text-gray-700">Terms of Service</button>{' '}
            and acknowledge that you've read our{' '}
            <button className="underline hover:text-gray-700">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}