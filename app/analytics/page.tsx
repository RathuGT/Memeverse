'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, X, TrendingUp, Eye, Smile, Share2, Download, BarChart3 } from "lucide-react"
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  viewsChange: number;
  likesChange: number;
  sharesChange: number;
  engagementChange: number;
}

interface TopMeme {
  meme_id: string;
  title: string;
  image_url: string;
  views_count: number;
  smiles_count: number;
  shares_count: number;
  comments_count: number;
  created_at: string;
  engagementRate: number;
}

interface TimeSeriesData {
  date: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

const MemeAnalytics: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<Stats>({
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0,
    engagementRate: 0,
    viewsChange: 0,
    likesChange: 0,
    sharesChange: 0,
    engagementChange: 0
  });
  const [topMemes, setTopMemes] = useState<TopMeme[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);

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
    { id: 1, text: 'Your analytics report is ready', time: '2h', seen: false },
    { id: 2, text: 'Engagement increased by 15%', time: '5h', seen: false },
  ]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [selectedMetric, setSelectedMetric] = useState<'views' | 'smiles' | 'shares' | 'comments'>('views');

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

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const getDateRange = () => {
    const now = new Date();
    const ranges: { [key: string]: Date } = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };
    return ranges[timeRange] || ranges['7d'];
  };

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchTopMemes(),
        fetchTimeSeriesData(),
        fetchCategoryData(),
        fetchHourlyData()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
  try {
    const startDate = getDateRange();
    
    // Get memes CREATED in this period
    const { data: currentMemes } = await supabase
      .from('meme')
      .select('views_count, smiles_count, shares_count, comments_count')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', new Date().toISOString());

    if (currentMemes && currentMemes.length > 0) {
      const totalViews = currentMemes.reduce((sum, m) => sum + m.views_count, 0);
      const totalLikes = currentMemes.reduce((sum, m) => sum + m.smiles_count, 0);
      const totalShares = currentMemes.reduce((sum, m) => sum + m.shares_count, 0);
      const totalComments = currentMemes.reduce((sum, m) => sum + m.comments_count, 0);
      
      const totalInteractions = totalLikes + totalShares + totalComments;
      const engagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;

      // Calculate previous period
      const periodLength = new Date().getTime() - startDate.getTime();
      const previousPeriodStart = new Date(startDate.getTime() - periodLength);
      
      const { data: previousMemes } = await supabase
        .from('meme')
        .select('views_count, smiles_count, shares_count, comments_count')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', startDate.toISOString());

      let viewsChange = null;
      let likesChange = null;
      let sharesChange = null;
      let engagementChange = null;
      
      if (previousMemes && previousMemes.length > 0) {
        const prevViews = previousMemes.reduce((sum, m) => sum + m.views_count, 0);
        const prevLikes = previousMemes.reduce((sum, m) => sum + m.smiles_count, 0);
        const prevShares = previousMemes.reduce((sum, m) => sum + m.shares_count, 0);
        const prevComments = previousMemes.reduce((sum, m) => sum + m.comments_count, 0);
        
        const prevInteractions = prevLikes + prevShares + prevComments;
        const prevEngagementRate = prevViews > 0 ? (prevInteractions / prevViews) * 100 : 0;

        // Only calculate change if previous values exist
        viewsChange = prevViews > 0 ? ((totalViews - prevViews) / prevViews) * 100 : null;
        likesChange = prevLikes > 0 ? ((totalLikes - prevLikes) / prevLikes) * 100 : null;
        sharesChange = prevShares > 0 ? ((totalShares - prevShares) / prevShares) * 100 : null;
        engagementChange = prevEngagementRate > 0 ? ((engagementRate - prevEngagementRate) / prevEngagementRate) * 100 : null;
      }

      setStats({
        totalViews,
        totalLikes,
        totalShares,
        totalComments,
        engagementRate,
        viewsChange: viewsChange ?? 0,
        likesChange: likesChange ?? 0,
        sharesChange: sharesChange ?? 0,
        engagementChange: engagementChange ?? 0
      });
    } else {
      // No memes in current period
      setStats({
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        engagementRate: 0,
        viewsChange: 0,
        likesChange: 0,
        sharesChange: 0,
        engagementChange: 0
      });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

  const fetchTopMemes = async () => {
    try {
      const startDate = getDateRange();
      
      const { data: memes } = await supabase
        .from('meme')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('views_count', { ascending: false })
        .limit(5);

      if (memes) {
        const topMemesWithEngagement = memes.map(meme => {
          const totalInteractions = meme.smiles_count + meme.shares_count + meme.comments_count;
          const engagementRate = meme.views_count > 0 ? (totalInteractions / meme.views_count) * 100 : 0;
          
          return {
            ...meme,
            engagementRate
          };
        });

        setTopMemes(topMemesWithEngagement);
      }
    } catch (error) {
      console.error('Error fetching top memes:', error);
    }
  };

  const fetchTimeSeriesData = async () => {
  try {
    const startDate = getDateRange();
    const now = new Date();
    const days = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const { data: memes } = await supabase
      .from('meme')
      .select('created_at, views_count, smiles_count, shares_count, comments_count')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (memes) {
      // Group by date
      const dataByDate: { [key: string]: TimeSeriesData } = {};
      
      // Initialize all dates in range
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dataByDate[dateStr] = {
          date: dateStr,
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0
        };
      }

      // Aggregate data by cumulative sum for better visualization
      memes.forEach(meme => {
        const dateStr = meme.created_at.split('T')[0];
        if (dataByDate[dateStr]) {
          dataByDate[dateStr].views += meme.views_count;
          dataByDate[dateStr].likes += meme.smiles_count;
          dataByDate[dateStr].shares += meme.shares_count;
          dataByDate[dateStr].comments += meme.comments_count;
        }
      });

      // Convert to array and sort by date
      const sortedData = Object.values(dataByDate).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setTimeSeriesData(sortedData);
    }
  } catch (error) {
    console.error('Error fetching time series data:', error);
    setTimeSeriesData([]);
  }
};

  const fetchCategoryData = async () => {
  try {
    const startDate = getDateRange();
    
    // Get memes with their category IDs
    const { data: memes } = await supabase
      .from('meme')
      .select('category_id')
      .gte('created_at', startDate.toISOString());

    if (memes) {
      // Count by category
      const categoryCounts: { [key: string]: number } = {};
      let total = 0;
      let uncategorizedCount = 0;

      memes.forEach(meme => {
        if (!meme.category_id) {
          uncategorizedCount++;
        } else {
          categoryCounts[meme.category_id] = (categoryCounts[meme.category_id] || 0) + 1;
        }
        total++;
      });

      // Fetch category names
      const categoryIds = Object.keys(categoryCounts);
      
      if (categoryIds.length === 0 && uncategorizedCount === 0) {
        setCategoryData([]);
        return;
      }

      const { data: categories } = await supabase
        .from('category')
        .select('category_id, name')
        .in('category_id', categoryIds);

      // Create a map of category ID to name
      const categoryNameMap = new Map(categories?.map(c => [c.category_id, c.name]) || []);

      // Convert to percentage with real names
      const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#f97316'];
      const categoryArray: CategoryData[] = [];

      // Add named categories
      Object.entries(categoryCounts).forEach(([categoryId, count], index) => {
        const categoryName = categoryNameMap.get(categoryId) || 'Unknown';
        categoryArray.push({
          name: categoryName,
          value: Math.round((count / total) * 100),
          color: colors[index % colors.length]
        });
      });

      // Add uncategorized if exists
      if (uncategorizedCount > 0) {
        categoryArray.push({
          name: 'Uncategorized',
          value: Math.round((uncategorizedCount / total) * 100),
          color: '#94a3b8'
        });
      }

      // Sort by value descending
      categoryArray.sort((a, b) => b.value - a.value);

      setCategoryData(categoryArray);
    }
  } catch (error) {
    console.error('Error fetching category data:', error);
    setCategoryData([]);
  }
};

  const fetchHourlyData = async () => {
    try {
      const startDate = getDateRange();
      
      const { data: memes } = await supabase
        .from('meme')
        .select('created_at, views_count, smiles_count, comments_count')
        .gte('created_at', startDate.toISOString());

      if (memes) {
        // Group by hour
        const hourlyEngagement: { [key: string]: number } = {};
        
        // Initialize all hours
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0') + ':00';
          hourlyEngagement[hour] = 0;
        }

        // Aggregate engagement by hour
        memes.forEach(meme => {
          const date = new Date(meme.created_at);
          const hour = date.getHours().toString().padStart(2, '0') + ':00';
          const engagement = meme.views_count + meme.smiles_count + meme.comments_count;
          hourlyEngagement[hour] += engagement;
        });

        const hourlyArray = Object.entries(hourlyEngagement).map(([hour, engagement]) => ({
          hour,
          engagement
        }));

        setHourlyData(hourlyArray);
      }
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  };

  const handleCreateMemes = () => {
    router.push('/create');
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard');
  };

  const getUserDisplayName = () => {
    if (userProfile?.username) return userProfile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    if (userProfile?.avatar_url) return userProfile.avatar_url;
    return null;
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

  const handleExportData = async () => {
    try {
      // Create CSV data
      const csvData = [
        ['Date', 'Views', 'Likes', 'Shares', 'Comments'],
        ...timeSeriesData.map(d => [
          d.date,
          d.views.toString(),
          d.likes.toString(),
          d.shares.toString(),
          d.comments.toString()
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setShowOptionsOverlay(false);
      alert('Analytics data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  // Handle scroll for header
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

  // Handle clicks outside dropdowns
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Similar structure to your other pages */}
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
                placeholder="Search analytics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center relative">
            <button 
              ref={optionsIconRef}
              onClick={handleOptionsIconClick}
              className="text-gray-600 hover:text-black font-medium lg:block hidden"
            >
              → Export Data
            </button>
            
            {showOptionsOverlay && (
              <div
                ref={optionsOverlayRef}
                className="absolute top-12 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 w-44"
              >
                <div 
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  onClick={handleExportData}
                >
                  Export as CSV
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
                  <button 
                    onClick={() => setShowProfileDropdown(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={16} />
                  </button>
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
        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleLeaderboard}>
         <svg
           className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
           fill="none"
           stroke="currentColor"
           viewBox="0 0 24 24"
         >
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
         </svg>
        </button>
  
        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleCreateMemes}>
         <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
          
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meme Analytics</h1>
              <p className="text-gray-600 mt-1">Performance of memes created in the selected time period</p>
            </div>
            {stats.viewsChange === null && (
                <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                 ℹ️ No previous period data available for comparison
                </div>
             )}
            <div className="flex items-center gap-3">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button 
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
                  <p className={`text-sm mt-1 ${
                    stats.viewsChange === null ? 'text-gray-500' :
                    stats.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {stats.viewsChange === null 
                      ? 'No comparison data' 
                      : `${formatChange(stats.viewsChange)} from previous period`
                    }
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Smiles</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalLikes)}</p>
                  <p className={`text-sm mt-1 ${stats.likesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatChange(stats.likesChange)} from previous period
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Smile className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shares</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalShares)}</p>
                  <p className={`text-sm mt-1 ${stats.sharesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatChange(stats.sharesChange)} from previous period
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Share2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.engagementRate.toFixed(1)}%</p>
                  <p className={`text-sm mt-1 ${stats.engagementChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatChange(stats.engagementChange)} from previous period
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Engagement Over Time */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Engagement Over Time</h3>
                <div className="flex gap-2">
                  {['views', 'smiles', 'shares', 'comments'].map((metric) => (
                    <button
                       key={metric}
                      onClick={() => setSelectedMetric(metric as 'views' | 'smiles' | 'shares' | 'comments')}
                       className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedMetric === metric
                           ? 'bg-blue-100 text-blue-700'
                           : 'text-gray-600 hover:bg-gray-100'
                        }`}
                     >
                        {metric === 'smiles' ? 'Smiles' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                     </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric === 'smiles' ? 'likes' : selectedMetric}
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Content Categories */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Content Categories</h3>
              {categoryData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="60%" height={200}>
                     <PieChart>
                        <Pie
                         data={categoryData as any}  // Add 'as any' cast
                         cx="50%"
                         cy="50%"
                         innerRadius={40}
                         outerRadius={80}
                         dataKey="value"
                       >
                         {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{category.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No category data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Best Posting Times */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Best Posting Times</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                 dataKey="date" 
                 tickFormatter={(value) => {
                   const date = new Date(value);
                   if (timeRange === '7d') {
                     return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                   } else if (timeRange === '30d') {
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else {
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }
                  }} 
                  />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="engagement" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performing Memes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Memes</h3>
            {topMemes.length > 0 ? (
              <div className="space-y-4">
                {topMemes.map((meme, index) => (
                  <div key={meme.meme_id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <img
                      src={meme.image_url}
                      alt={meme.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{meme.title}</h4>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(meme.views_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Smile className="w-4 h-4" />
                          {formatNumber(meme.smiles_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          {formatNumber(meme.shares_count)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">{meme.engagementRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No memes found for this time period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeAnalytics;