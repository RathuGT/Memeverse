'use client';
'use client';

import { useState, useEffect, useRef } from "react";
import { Search, Heart, ChevronRight, Eye, EyeOff, X, Menu, ChevronDown, AlertCircle } from "lucide-react";
import Image from "next/image";
import searchicon from './search-icon.png'
import SocialPost from "./post/page"

interface ValidationErrors {
  email?: string | null;
  password?: string | null;
  general?: string | null;
}

export default function MemeVerse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Form validation and security states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  
  // New section navigation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // Accessibility refs
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const trendingMemes = [
    {
      id: 1,
      likes: "1.5k",
      smiles: true,
      tags: ["Global", "Complaint", "Shy"],
      image: "/api/placeholder/300/200"
    },
    {
      id: 2,
      likes: "1.5k",
      smiles: true,
      tags: ["Global", "Complaint", "Shy"],
      image: "/api/placeholder/300/200"
    },
    {
      id: 3,
      likes: "1.5k",
      smiles: true,
      tags: ["Global", "Complaint", "Shy"],
      image: "/api/placeholder/300/200"
    },
    {
      id: 4,
      likes: "1.2k",
      smiles: true,
      tags: ["Global", "Complaint", "Shy"],
      image: "/api/placeholder/300/200"
    },
    {
      id: 5,
      likes: "980",
      smiles: true,
      tags: ["Global", "Complaint", "Shy"],
      image: "/api/placeholder/300/200"
    }
  ];

  const leaderboardData = [
    { rank: "#1", avatar: "🏆", username: "ChadMeister104", categories: "Unpopular, Personal, WW2", smiles: "34,592" },
    { rank: "#2", avatar: "🥈", username: "marcuso_yes104", categories: "Rome, WW2, Asian", smiles: "30,301" },
    { rank: "#3", avatar: "🥉", username: "busterdouglas104", categories: "Shy, Personal, Relationships", smiles: "27,794" },
    { rank: "#4", avatar: "4️⃣", username: "stephenjorkins304", categories: "Rose, WW2, Corny", smiles: "21,478" },
    { rank: "#5", avatar: "5️⃣", username: "ChadMeister104", categories: "Rose, Emotional, Lo-Fi", smiles: "19,298" }
  ];

  // Additional sections data
  const additionalSections = [
    {
      id: 'search',
      title: 'Search for a meme',
      subtitle: 'Millions up to the depth right on a few clicks through with many categories.',
      bgColor: 'bg-gradient-to-br from-yellow-200 to-yellow-300',
      content: (
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="max-w-lg text-center lg:text-left mb-8 lg:mb-0">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Search for a meme</h3>
            <p className="text-gray-700 text-base mb-6">Millions up to the depth right on a few clicks through with many categories.</p>
            <button className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
              Browse Memes
            </button>
          </div>
          <div className="relative">
            <div className="flex items-center space-x-4">
              {/* SpongeBob character */}
              <div className="w-24 h-32 bg-yellow-400 rounded-lg flex items-center justify-center relative">
                <span className="text-4xl">🧽</span>
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-brown-400 rounded-full"></div>
              </div>
              {/* Giga Chad character */}
              <div className="w-24 h-32 bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-4xl">💪</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'save',
      title: 'Save memes you like',
      subtitle: '',
      bgColor: 'bg-gradient-to-br from-teal-200 to-teal-300',
      content: (
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="max-w-lg text-center lg:text-left mb-8 lg:mb-0">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Save memes you like</h3>
            <button className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
              Start Saving
            </button>
          </div>
          <div className="relative">
            {/* Main meme display */}
            <div className="w-64 h-40 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-white text-sm">Meme Preview</span>
            </div>
            {/* Smaller meme thumbnails */}
            <div className="flex space-x-2">
              <div className="w-16 h-12 bg-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">📱</span>
              </div>
              <div className="w-16 h-12 bg-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">🎮</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'create',
      title: 'Think it, create it, share it',
      subtitle: '',
      bgColor: 'bg-gradient-to-br from-pink-200 to-pink-300',
      content: (
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="max-w-lg text-center lg:text-left mb-8 lg:mb-0">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Think it, create it, share it</h3>
            <button className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
              Start Now
            </button>
          </div>
          <div className="flex items-center space-x-6">
            {/* Light bulb icon */}
            <div className="w-16 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-3xl">💡</span>
            </div>
            {/* Creation tools */}
            <div className="grid grid-cols-2 gap-3">
              <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
                <span className="text-xl">✏️</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
                <span className="text-xl">🖼️</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg shadow flex items-center justify-center">
                <span className="text-xl">🎨</span>
              </div>
            </div>
            {/* Character */}
            <div className="w-16 h-20 bg-gray-400 rounded-lg flex items-center justify-center">
              <span className="text-3xl">😺</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSection = () => {
    setCurrentSectionIndex((prev) => (prev + 1) % additionalSections.length);
  };

  const prevSection = () => {
    setCurrentSectionIndex((prev) => (prev - 1 + additionalSections.length) % additionalSections.length);
  };

  const goToSection = (index: number) => {
    setCurrentSectionIndex(index);
  };

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
    setShowLoginModal(false);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    setEmail('');
    setPassword('');
    setErrors({});
    setIsLoading(false);
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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileMenu && !(event.target as Element).closest('.mobile-menu-container')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MemeVerse</h1>
              
              {/* Search bar - always visible */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-36 sm:w-48 lg:w-64">
                  <input
                    type="text"
                    placeholder="Browse Memes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-sm min-w-0"
                  />
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                </div>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex-shrink-0">
                  Browse Memes
                </button>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium">Leaderboard</a>
                <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium">About</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Mobile Menu Button */}
              <div className="relative sm:hidden mobile-menu-container">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Open navigation menu"
                  aria-expanded={showMobileMenu}
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* Mobile Dropdown Menu */}
                {showMobileMenu && (
                  <>
                    {/* Overlay to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMobileMenu(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Leaderboard
                        </a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          About
                        </a>
                        <button
                          onClick={() => {
                            setShowLoginModal(true);
                            setShowMobileMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Login
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Desktop Login Button */}
              <button 
                onClick={() => setShowLoginModal(true)}
                className="hidden sm:block bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-600"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-400 via-teal-400 to-yellow-400 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="max-w-lg text-center lg:text-left mb-8 lg:mb-0">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Welcome to MemeVerse</h2>
              <p className="text-white text-base sm:text-lg mb-6">Create, Share, Discover. Dominate the Leaderboard</p>
              <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Start Creating Memes
              </button>
            </div>
            <div className="hidden sm:block">
              <div className="w-48 h-48 sm:w-64 sm:h-64 bg-green-500 rounded-full flex items-center justify-center">
                <div className="text-6xl sm:text-8xl">🐸</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Easy Meme Creation</h3>
            <p className="text-gray-600 text-sm sm:text-base">Upload or choose from templates. Add text, tags and share instantly</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Engage with the Community</h3>
            <p className="text-gray-600 text-sm sm:text-base">Like, Bookmark and follow meme creators</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Climb the Leaderboard</h3>
            <p className="text-gray-600 text-sm sm:text-base">Earn likes to get ranked. Earn rewards along the way.</p>
          </div>
        </div>

        {/* Trending Memes */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trending Memes</h2>
            <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-4 scrollbar-hide">
            {trendingMemes.map((meme) => (
              <div key={meme.id} className="flex-shrink-0 w-72 sm:w-80">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-gray-600 text-3xl sm:text-4xl">🖼️</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{meme.likes} smiles</span>
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meme.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${
                            tag === "Global" ? "bg-red-100 text-red-700" :
                            tag === "Complaint" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Leaderboard</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="hidden sm:grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div>Ranking</div>
              <div>Categories</div>
              <div></div>
              <div className="text-right">Smiles</div>
            </div>
            
            {leaderboardData.map((user, index) => (
              <div key={index} className="p-3 sm:p-4 border-b last:border-b-0 hover:bg-gray-50">
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{user.rank}</span>
                      <span className="text-xl sm:text-2xl">{user.avatar}</span>
                      <span className="text-gray-900 font-medium text-sm">{user.username}</span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{user.smiles}</div>
                  </div>
                  <div className="text-gray-600 text-xs">{user.categories}</div>
                </div>
                
                {/* Desktop Layout */}
                <div className="hidden sm:grid grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-gray-900">{user.rank}</span>
                    <span className="text-2xl">{user.avatar}</span>
                    <span className="text-gray-900 font-medium">{user.username}</span>
                  </div>
                  <div className="text-gray-600">{user.categories}</div>
                  <div></div>
                  <div className="text-right font-bold text-gray-900">{user.smiles}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
            {/* Addtional section with  */}
       
        <section className="flex flex-col space-y-8 mt-12 sm:mt-16">

          <div className="container h-screen mx-auto p-4 md:p-8 rounded-3xl bg-white shadow-xl max-w-6xl flex items-center space-x-12">
            {/* Left Section */}
            < div className="w-1/2 relative min-h-[500px] flex items-center justify-center">
              {/* Top Right Large Image */}
              <img
                src="/memes/meme1.gif"
                alt="Meme 1"
                className="absolute top-0 right-0 w-60 h-40 object-cover rounded-2xl shadow-lg"
              />

              {/* Center Large Meme with Red Border */}
              <img
                src="/memes/meme2.jpg"
                alt="Meme 2"
                className="absolute  left-0 w-40 md:w-80 h-40 md:h-60 object-cover rounded-2xl shadow-lg border-4 border-red-500"
              />
              <Image
                src={searchicon}
                height={300}
                width={300}
                alt="Meme 3"
                className="absolute right-0"
              />

              {/* Bottom Comic Strip Image */}
              <img
                src="/memes/meme3.png"
                alt="Meme 3"
                className="absolute bottom-0 right-0 w-60 h-40 object-cover rounded-2xl shadow-lg"
             />
            </div>
                    
            {/* Right Section */}
            <div className="w-1/2 flex flex-col items-start justify-center md:p-10 mb-8 md:mb-0">
              <h1 className="text-3xl lg:text-5xl font-bold text-red-600 sm:mb-2 md:mb-4">
                Search for a meme
              </h1>
              <p className="text-gray-600 mt-4 md:mt-2 text-xs md:text-lg sm:mb-2 md:mb-8">
                What kind of humor are you looking for today? Type in anything and discover your next favorite meme.
              </p>
              <button className="bg-red-600 text-white text-sm md:text-lg font-semibold mt-4 md:mt-2 py-1 md:py-3 px-2 md:px-8 rounded-full shadow-lg hover:bg-red-700 transition-colors duration-300">
                Browse Memes
              </button>
            </div>
          </div>

          
          <div className="container h-screen mx-auto p-4 md:p-8 rounded-3xl bg-white shadow-xl max-w-6xl flex items-center space-x-12">
            {/* Left Section */}
            <div className="w-1/2 flex flex-col items-start justify-center md:p-10 mb-8 md:mb-0">
              <h1 className="text-3xl lg:text-5xl font-bold text-red-600 sm:mb-2 md:mb-4">
                Save memes you like
              </h1>
              <p className="text-gray-600 mt-4 md:mt-2 text-xs md:text-lg sm:mb-2 md:mb-8">
                Collect your favourites so you can get back to them later
              </p>
              <button className="bg-red-600 text-white text-sm md:text-lg font-semibold mt-4 md:mt-2 py-1 md:py-3 px-2 md:px-8 rounded-full shadow-lg hover:bg-red-700 transition-colors duration-300">
                Browse Memes
              </button>
            </div>
                    
            {/* Right Section */}
            < div className="w-1/2 relative min-h-[500px] flex items-center justify-center">
              {/* Top Right Large Image */}
              <img
                src="/memes/meme1.gif"
                alt="Meme 1"
                className="absolute top-0 right-0 w-60 h-40 object-cover rounded-2xl shadow-lg"
              />

              {/* Center Large Meme with Red Border */}
              <img
                src="/memes/meme2.jpg"
                alt="Meme 2"
                className="absolute  m-auto w-40 md:w-80 h-40 md:h-60 object-cover rounded-2xl shadow-lg border-4 border-red-500"
              />

              {/* Bottom Comic Strip Image */}
              <img
                src="/memes/meme3.png"
                alt="Meme 3"
                className="absolute bottom-0 left-0 w-60 h-40 object-cover rounded-2xl shadow-lg"
             />
            </div>
          </div>
          <div className="container h-screen mx-auto p-8 rounded-3xl bg-white shadow-xl max-w-6xl md:flex md:items-center md:space-x-12 flex flex-col md:flex-row">
              {/* Cards Section - Always at the top */}
              <div className="md:w-1/2 relative min-h-[400px] flex items-center justify-center mb-8 md:mb-20">
                <div className="absolute w-70 h-80 bg-gray-500 rounded-2xl shadow-lg rotate-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <SocialPost />
               </div>

               <div className="absolute w-70 h-80 bg-gray-400 rounded-2xl shadow-lg rotate-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <SocialPost />
                </div>

               <div className="absolute w-70 h-80 bg-white rounded-2xl shadow-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <SocialPost />
               </div>
             </div>

              {/* Text Section - Always at the bottom */}
              <div className="md:w-1/2 min-h-[500px] flex flex-col items-center md:items-start justify-center p-6 md:p-10">
               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-600 mb-4">
                  Think it, create it, share it
                </h1>
                <p className="text-gray-600 text-lg sm:text-xl mb-8">
                  You smile, everyone smiles
                </p>
                <button className="bg-red-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-red-700 transition-colors duration-300">
                  Browse Memes
                </button>
             </div>
            </div>
          
        </section>
        <section>
          <div className="flex flex-row items-center justify-between h-20 p-10 bg-green-950 text-xs rounded-2xl mt-8 md:mt-10">
            <div><h1>TERMS & CONDITIONS</h1></div>
            <div><h1>PRIVACY POLICY</h1></div>
            <div><h1>SITEMAP</h1></div>
            <div><h1>@2025 MemeVerse . All Rights reserved.</h1>
                <h1>Designed by BIT Maxxers</h1>           
            </div>
          </div>
        </section>

       
      </div>

      {/* Login Modal Overlay */}
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

            {/* Hidden CSRF Token */}
            <input type="hidden" name="csrf_token" value={csrfToken} />

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
}