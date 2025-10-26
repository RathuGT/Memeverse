'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Eye, EyeOff, X, AlertCircle } from "lucide-react"
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface MemeCardProps {
  id: number;
  height: number;
  onClick?: () => void;
}

interface ValidationErrors {
  email?: string | null;
  password?: string | null;
  general?: string | null;
}
const supabase = await createClient();
const { data: memes } = await supabase.from("memes").select();
const MemeCard: React.FC<MemeCardProps> = ({ id, height, onClick }) => {
  return (
    <div
      className="bg-gray-300 rounded-lg mb-4 break-inside-avoid cursor-pointer hover:opacity-90 transition"
      style={{ height: `${height}px` }}
      onClick={onClick}
    >
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Meme {id}
      </div>
    </div>
  );
};

const MemeVerse: React.FC = () => {

  


  const [columns, setColumns] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);

  // Options overlay state
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const optionsOverlayRef = useRef<HTMLDivElement>(null);
  const optionsIconRef = useRef<HTMLButtonElement>(null);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // Set to false to show overlay
  
  // Form validation and security states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  
  // Accessibility refs for modal
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const generateCards = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      height: Math.floor(Math.random() * 200) + 150,
    }));
  };

  const [cards] = useState(generateCards(50));

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
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain uppercase, lowercase, and number";
    }
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

  // Generate CSRF token (simplified for demo)
  const generateCSRFToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Enhanced login handler with validation and security
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
      // Simulate API call with CSRF protection
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for demo
          if (Math.random() > 0.7) {
            reject(new Error("Invalid credentials"));
          } else {
            resolve();
          }
        }, 1500);
      });

      // Success - reset attempts and close modal
      setLoginAttempts(0);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      setIsUserLoggedIn(true); // Set user as logged in
      console.log('Login successful');

    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setErrors({ 
        general: errorMessage === "Invalid credentials" 
          ? "Invalid email or password" 
          : "Login failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait." });
      return;
    }
    
    console.log('Google login clicked');
    // In production: redirect to Google OAuth
    setIsUserLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    setEmail('');
    setPassword('');
    setErrors({});
    setIsLoading(false);
  };

  // Handle User icon click
  const handleUserIconClick = () => {
    if (!isUserLoggedIn) {
      setShowLoginModal(true);
    } else {
      // User is logged in, could show user menu or profile
      console.log('User is already logged in');
    }
  };

  // Handle options overlay clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        showOptionsOverlay &&
        optionsOverlayRef.current &&
        !optionsOverlayRef.current.contains(target) &&
        optionsIconRef.current &&
        !optionsIconRef.current.contains(target)
      ) {
        setShowOptionsOverlay(false);
      }
    };

    if (showOptionsOverlay) {
      // Add a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showOptionsOverlay]);

  const handleOptionsIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsOverlay(!showOptionsOverlay);
  };

  // Accessibility: Modal management
  useEffect(() => {
    if (showLoginModal) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Generate CSRF token
      setCsrfToken(generateCSRFToken());
      
      // Focus management
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      // Keyboard event handler
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseLogin();
        }
        
        // Tab trapping
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, input, select, textarea, a[href]'
          );
          const firstElement = focusableElements?.[0] as HTMLElement;
          const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }
  }, [showLoginModal]);

  // Header hide/show logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Column count responsive
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1280) setColumns(4);
      else setColumns(5);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Scroll to selected post
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedPost]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className={`fixed top-0 left-0 right-0 bg-white z-20 border-b border-gray-200 px-4 py-3 transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-black mr-8 sm:block hidden">MemeVerse</h1>
              <h1 className="text-lg font-bold text-black mr-4 sm:hidden">MV</h1>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Browse Memes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center relative">
            <button 
              ref={optionsIconRef}
              onClick={handleOptionsIconClick}
              className="text-gray-600 hover:text-black font-medium lg:block hidden"
            >
              → Explore Categories
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>

            {/* Options Overlay */}
            {showOptionsOverlay && (
              <div
                ref={optionsOverlayRef}
                className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg py-2 z-50 w-36"
              >
                <div 
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => {
                    console.log('Download meme');
                    setShowOptionsOverlay(false);
                  }}
                >
                  Download meme
                </div>
                <div 
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => {
                    console.log('Hide meme');
                    setShowOptionsOverlay(false);
                  }}
                >
                  Hide meme
                </div>
                <div 
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    console.log('Report meme');
                    setShowOptionsOverlay(false);
                  }}
                >
                  Report meme
                </div>
              </div>
            )}
          </div>
          
          {/* User Icon - Updated with click handler */}
          <div className='text-black align-baseline hidden lg:block'>
            <button 
              onClick={handleUserIconClick}
              className={`p-2 rounded-lg transition-colors ${
                isUserLoggedIn 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'hover:bg-gray-100'
              }`}
              aria-label={isUserLoggedIn ? "User profile" : "Login"}
            >
              <User size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 h-full w-12 sm:w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6 z-10 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'top-20' : 'top-0 pt-8'
        }`}
      >
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.97 4.97l-8.5 8.5a1.5 1.5 0 000 2.12l4.5 4.5a1.5 1.5 0 002.12 0l8.5-8.5" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
            3
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-12 sm:ml-16 px-4 py-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <div
            className="w-full"
            style={{ columnCount: columns, columnGap: '16px', columnFill: 'balance' }}
          >
            {cards.map((card) => {
              if (selectedPost === card.id) {
                return (
                  <div key={card.id} ref={selectedRef} className="break-inside-avoid mb-4">
                    <div className="flex w-full gap-4">
                      {/* Left - Main Post */}
                      <div className="w-1/2 h-screen overflow-y-auto bg-white p-4">
                        <img
                          src={`/memes/${card.id}.jpg`}
                          alt={`Meme ${card.id}`}
                          className="h-[500px] w-auto object-contain mx-auto"
                        />
                        <div className="mt-4 text-gray-800">
                          <h2 className="text-xl font-bold">Meme {card.id}</h2>
                          <p className="mt-2">Post details go here...</p>
                        </div>
                      </div>

                      {/* Right - Related Posts */}
                      <div className="w-1/2 h-screen overflow-y-auto">
                        <div style={{ columnCount: 2, columnGap: '16px' }}>
                          {cards
                            .filter((c) => c.id !== card.id)
                            .slice(0, 10)
                            .map((related) => (
                              <div key={related.id} className="break-inside-avoid mb-4">
                                <MemeCard
                                  id={related.id}
                                  height={related.height}
                                  onClick={() => setSelectedPost(related.id)}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={card.id} className="break-inside-avoid mb-4">
                  <MemeCard id={card.id} height={card.height} onClick={() => setSelectedPost(card.id)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Login Modal Overlay - Same as page.tsx */}
      {/* Login Modal (for non-authenticated users) */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          onClick={(e) => e.target === e.currentTarget && handleCloseLogin()}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={handleCloseLogin}
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
              aria-label="Close login modal"
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
            <h1 id="login-title" className="text-2xl font-semibold text-gray-800 mb-8 text-center">
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
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-red-500 focus:border-transparent'
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
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-red-500 focus:border-transparent'
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
      )}
    </div>
  );
};

export default MemeVerse;