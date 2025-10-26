'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, X, MoveUp, MoveDown, TrendingUp} from "lucide-react";
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MemberData {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_smiles_received: number;
  total_memes_created: number;
  rank: number;
}

interface CategoryData {
  category_id: string;
  category_name: string;
  meme_count: number;
}

interface TopMeme {
  meme_id: string;
  title: string;
  image_url: string;
  smiles_count: number;
  views_count: number;
  username: string;
}

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'categories'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [topMembers, setTopMembers] = useState<MemberData[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryData[]>([]);
  const [topMemes, setTopMemes] = useState<TopMeme[]>([]);
  const [userRank, setUserRank] = useState<{ global: number; change: number } | null>(null);

  // UI states
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const optionsOverlayRef = useRef<HTMLDivElement>(null);
  const optionsIconRef = useRef<HTMLButtonElement>(null);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);
  
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Check your new ranking position!', time: '1h', seen: false },
    { id: 2, text: 'New top meme in trending', time: '3h', seen: false },
  ]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);
          
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, []);

  // Fetch all leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTopMembers(),
        fetchTopCategories(),
        fetchTopMemes(),
        user && fetchUserRank()
      ]);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopMembers = async () => {
    try {
      const { data: members, error } = await supabase
        .from('user_profiles')
        .select('user_id, username, avatar_url, total_smiles_received, total_memes_created')
        .order('total_smiles_received', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (members) {
        const membersWithRank = members.map((member, index) => ({
          ...member,
          rank: index + 1
        }));
        setTopMembers(membersWithRank);
      }
    } catch (error) {
      console.error('Error fetching top members:', error);
    }
  };

 const fetchTopCategories = async () => {
  try {
    // First, get all categories
    const { data: allCategories, error: catError } = await supabase
      .from('category')
      .select('category_id, name');

    if (catError) {
      console.error('Error fetching categories:', catError);
      setTopCategories([]);
      return;
    }

    if (!allCategories || allCategories.length === 0) {
      console.log('No categories found in database');
      setTopCategories([]);
      return;
    }

    console.log('All categories:', allCategories);

    // Now count memes for each category
    const categoriesWithCounts = await Promise.all(
      allCategories.map(async (cat) => {
        const { count, error } = await supabase
          .from('meme')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.category_id);
        
        if (error) {
          console.error(`Error counting memes for category ${cat.name}:`, error);
          return {
            category_id: cat.category_id,
            category_name: cat.name,
            meme_count: 0
          };
        }
        
        return {
          category_id: cat.category_id,
          category_name: cat.name,
          meme_count: count || 0
        };
      })
    );
    
    console.log('Categories with counts:', categoriesWithCounts);
    
    // Filter out categories with no memes, sort by count, and take top 15
    const sortedCategories = categoriesWithCounts
      .filter(c => c.meme_count > 0)
      .sort((a, b) => b.meme_count - a.meme_count)
      .slice(0, 15);
    
    setTopCategories(sortedCategories);
  } catch (error) {
    console.error('Error fetching top categories:', error);
    setTopCategories([]);
  }
};

  const fetchTopMemes = async () => {
  try {
    const { data: memes, error } = await supabase
      .from('meme')
      .select(`
        meme_id,
        title,
        image_url,
        smiles_count,
        views_count,
        creator_id
      `)
      .order('smiles_count', { ascending: false })
      .limit(30);

    if (error) throw error;

    if (memes) {
      // Fetch usernames for the memes
      const userIds = [...new Set(memes.map(m => m.creator_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

      const memesWithUsernames = memes.map(meme => ({
        meme_id: meme.meme_id,
        title: meme.title,
        image_url: meme.image_url,
        smiles_count: meme.smiles_count,
        views_count: meme.views_count,
        username: usernameMap.get(meme.creator_id) || 'Anonymous'
      }));

      setTopMemes(memesWithUsernames);
    }
  } catch (error) {
    console.error('Error fetching top memes:', error);
  }
};

  const fetchUserRank = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_smiles_received')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Count users with more smiles
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_smiles_received', profile.total_smiles_received);

        const rank = (count || 0) + 1;
        setUserRank({
          global: rank,
          change: Math.floor(Math.random() * 10) - 3 // Placeholder for rank change
        });
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  const handleCreateMemes = () => {
    router.push('/create');
  };

  const handleAnalytics = () => {
    router.push('/analytics');
  };

  const handleLoadProfile = () => {
    router.push('/profile');
  };

  const getUserDisplayName = () => {
    if (userProfile?.username) return userProfile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = (): string | undefined => {
    return userProfile?.avatar_url || user?.user_metadata?.avatar_url || undefined;
  };

  const getSmileCount = () => {
    return userProfile?.total_smiles_received || 0;
  };

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
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOptionsIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsOverlay(!showOptionsOverlay);
  };

  // Handle notifications
  useEffect(() => {
    if (showNotifications) {
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    }
  }, [showNotifications]);

  // Handle click outside dropdowns
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

  // Filter members based on search
  const filteredMembers = topMembers.filter(member =>
    member.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                placeholder="Search members..."
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
              → View Stats
            </button>
            
            {showOptionsOverlay && (
              <div
                ref={optionsOverlayRef}
                className="absolute top-12 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 w-44"
              >
                <div 
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  onClick={handleAnalytics}
                >
                  Analytics Dashboard
                </div>
              </div>
            )}
          </div>
          
          {/* User Icon */}
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
                <img 
                  src={getUserAvatar()!} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User size={24} />
              )}
            </button>

            {/* Profile Dropdown */}
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
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded" onClick={handleLoadProfile}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setShowProfileDropdown(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    {getUserAvatar() ? (
                      <img 
                        src={getUserAvatar()!} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full"
                      />
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
        <button className="p-2 bg-blue-100 text-blue-700 rounded-lg">
         <svg
           className="w-5 h-5 sm:w-6 sm:h-6"
           fill="none"
           stroke="currentColor"
           viewBox="0 0 24 24"
         >
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
         </svg>
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleAnalytics}>
          <TrendingUp className='text-black'/>
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
          <div className='mb-6'>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">            
            {/* Left Section - Top Members/Categories */}
            <div className="lg:col-span-1">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === 'members'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Top Members
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === 'categories'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Top Categories
                </button>
              </div>

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Top Members</h2>
                    <div className="flex space-x-2 text-sm text-gray-500 gap-4 mr-6">
                      <span>Smiles</span>
                      <span>Rank</span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member, index) => (
                        <div key={member.user_id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {member.username?.charAt(0).toUpperCase() || 'A'}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-1 flex-row min-w-0 items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">{member.username || 'Anonymous'}</p>
                            {index < 3 && <MoveUp color="#1eff00" size={16} className="ml-1"/>}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 gap-8">
                              <p className="text-sm font-medium text-gray-900">{member.total_smiles_received}</p>
                              <span className={`font-bold ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                index === 2 ? 'text-orange-600' :
                                'text-red-500'
                              }`}>
                                #{member.rank}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No members found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {topCategories.length > 0 ? (
                      topCategories.map((category, index) => (
                        <div key={category.category_id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-900">{category.category_name}</p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {category.meme_count} memes
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No categories found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Your Rank Section */}
              {isUserLoggedIn && userRank && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Your rank</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className='flex flex-row'>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">#{userRank.global}</p>
                        <p className="text-xs text-gray-500">Global</p>
                      </div>
                      {userRank.change > 0 ? (
                        <MoveUp size={36} color="#1eff00" className='m-auto'/>
                      ) : userRank.change < 0 ? (
                        <MoveDown size={36} color="#ff0000" className='m-auto'/>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {userRank.change > 0 
                      ? `You've moved up ${userRank.change} places! Keep it up!` 
                      : userRank.change < 0
                      ? `You've moved down ${Math.abs(userRank.change)} places. Time to create more memes!`
                      : 'Your rank remained the same.'}
                  </p>
                </div>
              )}
            </div>

            {/* Right Section - Top Memes Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-lg text-black font-semibold mb-6">Top Memes</h2>
              {topMemes.length > 0 ? (
                <div className="columns-2 md:columns-3 gap-4">
                  {topMemes.map((meme) => (
                    <div 
                      key={meme.meme_id} 
                      className="break-inside-avoid mb-4 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/meme/${meme.meme_id}`)}
                    >
                      <img
                        src={meme.image_url}
                        alt={meme.title}
                        className="w-full h-auto object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{meme.title}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>by {meme.username}</span>
                          <span>😊 {meme.smiles_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No memes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
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
              <h3 className="text-lg font-semibold">Leaderboard Updates</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-0">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b ${!notif.seen ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm">{notif.text}</p>
                  <span className="text-xs text-gray-400">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="hidden lg:block fixed bg-white z-50 w-80 rounded-lg shadow-lg border max-h-96 overflow-y-auto"
            style={{
              left: '5rem',
              top: isHeaderVisible ? '5rem' : '1rem'
            }}
          >
            <div className="sticky top-0 bg-white flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Updates</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X size={20} />
              </button>
            </div>

            <div>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b ${!notif.seen ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm">{notif.text}</p>
                  <span className="text-xs text-gray-400">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;