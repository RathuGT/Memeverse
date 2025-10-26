'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, X, ChevronDown, MoreVertical, Minimize2, Plus } from "lucide-react"
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Meme {
  meme_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  smiles_count: number;
  comments_count: number;
  created_at: string;
}

interface Bookmark {
  bookmark_id: string;
  user_id: string;
  meme_id: string;
  folder_name: string;
  created_at: string;
  meme: Meme;
}

const ProfilePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  // Options overlay state
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const optionsOverlayRef = useRef<HTMLDivElement>(null);
  const optionsIconRef = useRef<HTMLButtonElement>(null);

  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);

  const [hasNotifications, setHasNotifications] = useState(true);
  
  const router = useRouter();

  const handleCreateMemes = () => {
    router.push('/create');
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard');
  };

  const handleMemeAnalytics = () => {
    router.push('/analytics');
  };

  const handleViewProfile = () => { 
    router.push('/profile-view');
  };

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your next obsession awaits', time: '5d', seen: true },
    { id: 2, text: 'Pure icon behaviour', time: '5d', seen: true },
    { id: 3, text: 'This is so you-coded', time: '6d', seen: true },
    { id: 4, text: 'So iconic', time: '6d', seen: true },
    { id: 5, text: 'Love this for you', time: '1w', seen: false },
    { id: 6, text: 'You\'d vibe with this', time: '1w', seen: false },
    { id: 7, text: 'Just added for you', time: '1w', seen: false },
    { id: 8, text: 'Take a moment for yourself', time: '1w', seen: false },
  ]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  useEffect(() => {
    if (showNotifications) {
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    }
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNotifications &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.notification-panel')
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleNotificationClick = (notification: any) => {
    console.log('Clicked notification:', notification);
    setShowNotifications(false);
  };

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);
          
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            setUserProfile(JSON.parse(storedProfile));
          } else {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile);
              localStorage.setItem('userProfile', JSON.stringify(profile));
            }
          }
        } else {
          setUser(null);
          setIsUserLoggedIn(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);
          
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile);
              localStorage.setItem('userProfile', JSON.stringify(profile));
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsUserLoggedIn(false);
          setUserProfile(null);
          localStorage.removeItem('userProfile');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch bookmarked memes
useEffect(() => {
  const fetchBookmarks = async () => {
    if (!user) {
      setLoadingBookmarks(false);
      return;
    }

    try {
      setLoadingBookmarks(true);
      
      // First, get the bookmarks
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmark')
        .select('bookmark_id, user_id, meme_id, folder_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookmarkError) throw bookmarkError;

      if (!bookmarkData || bookmarkData.length === 0) {
        setBookmarks([]);
        setLoadingBookmarks(false);
        return;
      }

      // Get the meme IDs
      const memeIds = bookmarkData.map(b => b.meme_id);

      // Fetch the memes separately
      const { data: memeData, error: memeError } = await supabase
        .from('meme')
        .select('meme_id, creator_id, title, description, image_url, thumbnail_url, smiles_count, comments_count, created_at')
        .in('meme_id', memeIds);

      if (memeError) throw memeError;

      // Create a map of memes by ID
      const memeMap = new Map(memeData?.map(m => [m.meme_id, m]) || []);

      // Combine bookmarks with their memes
      const combinedData: Bookmark[] = bookmarkData
        .map(bookmark => ({
          ...bookmark,
          meme: memeMap.get(bookmark.meme_id)!
        }))
        .filter(b => b.meme); // Filter out any bookmarks where meme doesn't exist

      setBookmarks(combinedData);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  fetchBookmarks();
}, [user]);

  // Remove bookmark
  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmark')
        .delete()
        .eq('bookmark_id', bookmarkId);

      if (error) throw error;

      setBookmarks(prev => prev.filter(b => b.bookmark_id !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('Failed to remove bookmark');
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.username) return userProfile.username;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    if (userProfile?.avatar_url) return userProfile.avatar_url;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    return null;
  };

  const getSmileCount = () => {
    return userProfile?.total_smiles_received || 0;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showProfileDropdown &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        userIconRef.current &&
        !userIconRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showProfileDropdown]);

  const handleUserIconClick = () => {
    if (isUserLoggedIn) {
      setShowProfileDropdown(!showProfileDropdown);
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  // Prevent scroll when modal open
  useEffect(() => {
    if (selectedMeme) {
      const currentScroll = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScroll}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    }
  }, [selectedMeme]);

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
                placeholder="Search memes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          </div>
          
          <div className='text-black align-baseline hidden lg:block relative'>
            <button 
              ref={userIconRef}
              onClick={handleUserIconClick}
              className={`p-2 rounded-lg transition-colors ${
                isUserLoggedIn 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {isUserLoggedIn && getUserAvatar() ? (
                <img src={getUserAvatar()!} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </button>

            {showProfileDropdown && isUserLoggedIn && (
              <div
                ref={profileDropdownRef}
                className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl shadow-lg w-80 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">{getSmileCount()} smiles</span>
                  </div>
                  <button onClick={() => setShowProfileDropdown(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    {getUserAvatar() ? (
                      <img src={getUserAvatar()!} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{getUserDisplayName()}</div>
                      <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 h-full w-12 sm:w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6 z-10 transition-all duration-300 ease-in-out ${
         isHeaderVisible ? 'top-20' : 'top-0 pt-8'
        }`}
      >
        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleLeaderboard}>
         <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
         </svg>
        </button>
  
        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleCreateMemes}>
         <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
  
        {isUserLoggedIn && (
         <button
            className="p-2 hover:bg-gray-100 rounded-lg relative"
            onClick={() => setShowNotifications(!showNotifications)}
         >
           <Bell size={24} className="text-gray-700" />
           {notifications.some(n => !n.seen) && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
         </button>
        )}
      </div>

      {/* Main Content */}
      <div className="ml-12 sm:ml-16 px-4 py-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="font-medium text-gray-900">{getUserDisplayName()}</h1>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="px-3 py-1 bg-gradient-to-r from-yellow-500 via-indigo-600 to-red-700 text-transparent bg-clip-text inline-block hover:opacity-80" 
                  onClick={handleViewProfile}
                >
                  View Profile
                </button>
                <button 
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-slate-700 text-transparent bg-clip-text inline-block hover:opacity-80" 
                  onClick={handleMemeAnalytics}
                >
                  Meme Analytics
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Your Achievements Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Achievements</h2>
                <div className="grid grid-cols-5 gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="aspect-square bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-gray-400 h-1 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              {/* Saved Memes Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Saved Memes ({bookmarks.length})
                  </h2>
                </div>

                {loadingBookmarks ? (
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No saved memes yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start bookmarking memes to see them here</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      {bookmarks.slice(0, 10).map((bookmark) => (
                        <div 
                          key={bookmark.bookmark_id} 
                          className="aspect-square bg-gray-200 rounded-lg relative group cursor-pointer overflow-hidden"
                          onClick={() => {
                            setScrollPosition(window.scrollY);
                            setSelectedMeme(bookmark.meme as Meme);
                          }}
                        >
                          <img
                            src={bookmark.meme.thumbnail_url || bookmark.meme.image_url}
                            alt={bookmark.meme.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Remove this bookmark?')) {
                                  removeBookmark(bookmark.bookmark_id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {bookmarks.length > 10 && (
                      <div className="text-right">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View all {bookmarks.length} bookmarks
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Boards Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Boards</h2>
                <div className="grid grid-cols-5 gap-4">
                  <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg relative group cursor-pointer">
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-medium text-gray-800">Keep it nice and smiley</p>
                    </div>
                  </div>
                  {[3, 4, 5].map((item) => (
                    <div key={item} className="aspect-square bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">Organize your favourite memes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meme Modal */}
      {selectedMeme && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50"
            onClick={() => {
              setSelectedMeme(null);
              setTimeout(() => window.scrollTo(0, scrollPosition), 0);
            }}
          />
          
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="min-h-full flex items-center justify-center p-4">
              <div 
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setSelectedMeme(null);
                    setTimeout(() => window.scrollTo(0, scrollPosition), 0);
                  }}
                  className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <X size={24} />
                </button>

                <div className="p-6">
                  <img
                    src={selectedMeme.image_url}
                    alt={selectedMeme.title}
                    className="max-h-[60vh] w-auto mx-auto rounded-lg mb-4"
                  />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMeme.title}</h2>
                  {selectedMeme.description && (
                    <p className="text-gray-600 mb-4">{selectedMeme.description}</p>
                  )}
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                      </svg>
                      {selectedMeme.smiles_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {selectedMeme.comments_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowNotifications(false)}
          />

          <div
            ref={notificationsRef}
            className="notification-panel fixed inset-0 bg-white z-50 overflow-y-auto lg:hidden"
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Updates</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-0">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notif.seen ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{notif.text}</span>
                      <span className="text-xs text-gray-400 ml-2">{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="notification-panel hidden lg:block fixed bg-white z-50 w-80 rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
            style={{
              left: '5rem',
              top: isHeaderVisible ? '5rem' : '1rem'
            }}
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Updates</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-0">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notif.seen ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{notif.text}</span>
                      <span className="text-xs text-gray-400 ml-2">{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;