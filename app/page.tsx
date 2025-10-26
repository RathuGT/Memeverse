'use client';

import { useState, useEffect, useRef } from "react";
import { Search, Heart, ChevronRight, Eye, EyeOff, X, Menu, ChevronDown, AlertCircle } from "lucide-react";
import Image from "next/image";
import searchicon from './search-icon.png'
import SocialPost from "./post/page"
import { useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

// Supabase client (same as in login component)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');



export default function MemeVerse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Add this missing state
  
  // Search overlay state
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchIconRef = useRef<HTMLButtonElement>(null);

  interface Meme {
  meme_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  created_at: string;
  smiles_count: number;
  comments_count: number;
}

interface LeaderboardUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_smiles_received: number;
  categories?: string[];
}

const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

interface Category {
  category_id: string;
  name: string;
} 

  
  

  const router = useRouter();
  
  const handleBrowseMemes = () => {
    router.push('/memes');
  };

  const handleEditMemes = () => {
    router.push('/edit');
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard');
  };

  // Add login redirect handler
  const handleLoginClick = () => {
    router.push('/login');
  };

  // Handle search overlay clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showOptionsOverlay &&
        searchOverlayRef.current &&
        !searchOverlayRef.current.contains(event.target as Node) &&
        searchIconRef.current &&
        !searchIconRef.current.contains(event.target as Node)
      ) {
        setShowOptionsOverlay(false);
      }
    };

    if (showOptionsOverlay) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showOptionsOverlay]);

  const handleSearchIconClick = () => {
    setShowOptionsOverlay(!showOptionsOverlay);
  };

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

  

  const [trendingMemes, setTrendingMemes] = useState<Meme[]>([]);
const [categories, setCategories] = useState<Map<string, string>>(new Map());
const [loadingMemes, setLoadingMemes] = useState(true);

// Fetch trending memes
useEffect(() => {
  const fetchTrendingMemes = async () => {
    try {
      setLoadingMemes(true);
      
      // Fetch top 6 memes by smiles_count
      const { data: memesData, error: memesError } = await supabase
        .from('meme')
        .select('*')
        .eq('is_published', true)
        .eq('visibility', 'public')
        .order('smiles_count', { ascending: false })
        .limit(6);

      if (memesError) throw memesError;

      if (memesData && memesData.length > 0) {
        setTrendingMemes(memesData);

        // Fetch categories for these memes
        const categoryIds = [...new Set(memesData.map(m => m.category_id).filter(Boolean))];
        
        if (categoryIds.length > 0) {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('category')
            .select('category_id, name')
            .in('category_id', categoryIds);

          if (!categoriesError && categoriesData) {
            const categoryMap = new Map(
              categoriesData.map(cat => [cat.category_id, cat.name])
            );
            setCategories(categoryMap);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching trending memes:', error);
    } finally {
      setLoadingMemes(false);
    }
  };

  fetchTrendingMemes();
}, []);


  // Fetch leaderboard data
useEffect(() => {
  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      
      // Fetch top 5 users by total_smiles_received
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, username, avatar_url, total_smiles_received')
        .order('total_smiles_received', { ascending: false })
        .limit(5);

      if (usersError) throw usersError;

      if (usersData && usersData.length > 0) {
        // Fetch top categories for each user
        const usersWithCategories = await Promise.all(
          usersData.map(async (user) => {
            try {
              // Get user's memes with categories
              const { data: memesData } = await supabase
                .from('meme')
                .select('category_id')
                .eq('creator_id', user.user_id)
                .not('category_id', 'is', null)
                .limit(20);

              if (!memesData || memesData.length === 0) {
                return { ...user, categories: [] };
              }

              // Count category occurrences
              const categoryCounts: { [key: string]: number } = {};
              memesData.forEach(meme => {
                if (meme.category_id) {
                  categoryCounts[meme.category_id] = (categoryCounts[meme.category_id] || 0) + 1;
                }
              });

              // Get top 3 categories
              const topCategoryIds = Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([id]) => id);

              // Fetch category names
              const { data: categoriesData } = await supabase
                .from('category')
                .select('name')
                .in('category_id', topCategoryIds);

              const categoryNames = categoriesData?.map(cat => cat.name) || [];
              return { ...user, categories: categoryNames };
            } catch (error) {
              console.error('Error fetching categories for user:', user.user_id, error);
              return { ...user, categories: [] };
            }
          })
        );

        setLeaderboardData(usersWithCategories);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  fetchLeaderboard();
}, []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  

  // Add authentication check at the top of your useEffect hooks
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is logged in, redirect to memes page
          router.push('/memes');
          return;
        }
        
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndRedirect();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/memes');
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return "🏆";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    case 4:
      return "4️⃣";
    case 5:
      return "5️⃣";
    default:
      return `#${rank}`;
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
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
                  <button
                    ref={searchIconRef}
                    onClick={handleSearchIconClick}
                    className="flex-shrink-0 ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex-shrink-0"
                onClick={handleBrowseMemes}>
                  Browse Memes
                </button>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium" onClick={handleLeaderboard}>Leaderboard</a>
                <a href="#" className="text-gray-700 hover:text-gray-900 text-sm font-medium">About</a>
              </nav>
            </div>
            
            {/* Options Overlay */}
            {showOptionsOverlay && (
              <div
                ref={searchOverlayRef}
                className="absolute left-4 sm:left-auto sm:right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 w-64"
              >
                <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  Download meme
                </div>
                <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  Hide meme
                </div>
                <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  Report meme
                </div>
              </div>
            )}
            
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
                            handleLoginClick();
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
                onClick={handleLoginClick}
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
              <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              onClick={handleEditMemes}>
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
        {/* Trending Memes */}
<section className="mb-12 sm:mb-16">
  <div className="flex items-center justify-between mb-4 sm:mb-6">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trending Memes</h2>
    <button 
      onClick={handleBrowseMemes}
      className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
    >
      View All
      <ChevronRight className="w-4 h-4 ml-1" />
    </button>
  </div>
  
  <div className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-4 scrollbar-hide">
    {loadingMemes ? (
      // Loading skeleton
      [...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-72 sm:w-80">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-video bg-gray-200 animate-pulse"></div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : trendingMemes.length > 0 ? (
      trendingMemes.map((meme) => (
        <div key={meme.meme_id} className="flex-shrink-0 w-72 sm:w-80">
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="aspect-video bg-gray-200 relative overflow-hidden">
              <img
                src={meme.thumbnail_url || meme.image_url}
                alt={meme.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {meme.smiles_count.toLocaleString()} smiles
                  </span>
                  <svg 
                    className="w-4 h-4 text-gray-700" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1">
                {meme.title}
              </h3>
              
              {/* Category Tag */}
              {meme.category_id && categories.has(meme.category_id) && (
                <div className="flex flex-wrap gap-1">
                  <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                    {categories.get(meme.category_id)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="w-full text-center py-12">
        <p className="text-gray-500">No trending memes available yet.</p>
      </div>
    )}
  </div>
</section>

        {/* Leaderboard */}
<section>
  <div className="flex items-center justify-between mb-4 sm:mb-6">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Leaderboard</h2>
    <button 
      onClick={handleLeaderboard}
      className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
    >
      View All
      <ChevronRight className="w-4 h-4 ml-1" />
    </button>
  </div>
  
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="hidden sm:grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
      <div>Ranking</div>
      <div>Categories</div>
      <div></div>
      <div className="text-right">Smiles</div>
    </div>
    
    {loadingLeaderboard ? (
      // Loading skeleton
      [...Array(5)].map((_, index) => (
        <div key={index} className="p-3 sm:p-4 border-b last:border-b-0">
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="hidden sm:grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div></div>
            <div className="text-right w-20 h-4 bg-gray-200 rounded animate-pulse ml-auto"></div>
          </div>
        </div>
      ))
    ) : leaderboardData.length > 0 ? (
      leaderboardData.map((user, index) => {
        const rank = index + 1;
        return (
          <div key={user.user_id} className="p-3 sm:p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">#{rank}</span>
                  <span className="text-xl sm:text-2xl">{getRankIcon(rank)}</span>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  )}
                  <span className="text-gray-900 font-medium text-sm">
                    {user.username || 'Anonymous'}
                  </span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {user.total_smiles_received.toLocaleString()}
                </div>
              </div>
              <div className="text-gray-600 text-xs ml-12">
                {user.categories && user.categories.length > 0 
                  ? user.categories.join(', ')
                  : 'No categories yet'}
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-gray-900">#{rank}</span>
                <span className="text-2xl">{getRankIcon(rank)}</span>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                )}
                <span className="text-gray-900 font-medium">
                  {user.username || 'Anonymous'}
                </span>
              </div>
              <div className="text-gray-600">
                {user.categories && user.categories.length > 0 
                  ? user.categories.join(', ')
                  : 'No categories yet'}
              </div>
              <div></div>
              <div className="text-right font-bold text-gray-900">
                {user.total_smiles_received.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div className="p-8 text-center text-gray-500">
        No leaderboard data available yet.
      </div>
    )}
  </div>
</section>

        {/* Additional sections */}
        <section className="flex flex-col space-y-8 mt-12 sm:mt-16">
          <div className="container h-screen mx-auto p-4 md:p-8 rounded-3xl bg-white shadow-xl max-w-6xl flex items-center space-x-12">
            {/* Left Section */}
            <div className="w-1/2 relative min-h-[500px] flex items-center justify-center">
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
                className="absolute left-0 w-40 md:w-80 h-40 md:h-60 object-cover rounded-2xl shadow-lg border-4 border-red-500"
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
            <div className="w-1/2 relative min-h-[500px] flex items-center justify-center">
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
                className="absolute m-auto w-40 md:w-80 h-40 md:h-60 object-cover rounded-2xl shadow-lg border-4 border-red-500"
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
            {/* Cards Section */}
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

            {/* Text Section */}
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
    </div>
  );
}