'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, X, DollarSign, Target, MousePointer, Users, Calendar, Filter, Download, Play, Pause, Edit, Trash2, Plus, TrendingUp, Eye } from "lucide-react"
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Create Supabase client instance outside component to avoid multiple instances
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sample campaign data
const campaignPerformanceData = [
  { date: '2024-01-01', impressions: 12000, clicks: 480, conversions: 24, spend: 120 },
  { date: '2024-01-02', impressions: 18900, clicks: 756, conversions: 45, spend: 189 },
  { date: '2024-01-03', impressions: 24000, clicks: 960, conversions: 67, spend: 240 },
  { date: '2024-01-04', impressions: 16000, clicks: 640, conversions: 34, spend: 160 },
  { date: '2024-01-05', impressions: 21000, clicks: 840, conversions: 52, spend: 210 },
  { date: '2024-01-06', impressions: 28000, clicks: 1120, conversions: 78, spend: 280 },
  { date: '2024-01-07', impressions: 32000, clicks: 1280, conversions: 89, spend: 320 }
];

const audienceData = [
  { name: '18-24', value: 35, color: '#8b5cf6' },
  { name: '25-34', value: 28, color: '#06b6d4' },
  { name: '35-44', value: 20, color: '#10b981' },
  { name: '45-54', value: 12, color: '#f59e0b' },
  { name: '55+', value: 5, color: '#ef4444' }
];

const campaignsData = [
  { 
    id: 1, 
    name: "Summer Meme Campaign", 
    status: "active", 
    budget: 5000, 
    spent: 3420, 
    impressions: 245000, 
    clicks: 9800, 
    ctr: 4.0, 
    conversions: 156,
    startDate: "2024-01-01",
    endDate: "2024-01-31"
  },
  { 
    id: 2, 
    name: "Back to School Vibes", 
    status: "paused", 
    budget: 3000, 
    spent: 1890, 
    impressions: 156000, 
    clicks: 6240, 
    ctr: 4.0, 
    conversions: 98,
    startDate: "2024-01-15",
    endDate: "2024-02-15"
  },
  { 
    id: 3, 
    name: "Weekend Mood Campaign", 
    status: "active", 
    budget: 2500, 
    spent: 2340, 
    impressions: 189000, 
    clicks: 7560, 
    ctr: 4.0, 
    conversions: 123,
    startDate: "2024-01-10",
    endDate: "2024-02-10"
  },
  { 
    id: 4, 
    name: "Gaming Memes Push", 
    status: "completed", 
    budget: 4000, 
    spent: 4000, 
    impressions: 320000, 
    clicks: 12800, 
    ctr: 4.0, 
    conversions: 234,
    startDate: "2023-12-01",
    endDate: "2023-12-31"
  }
];

const AdvertiserDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');

  // Options overlay state
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const optionsOverlayRef = useRef<HTMLDivElement>(null);
  const optionsIconRef = useRef<HTMLButtonElement>(null);

  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(true);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);
  
  // Campaign modal state
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  
  const router = useRouter();

  const handleCreateMemes = () => {
    router.push('/create');
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard');
  };

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Campaign "Summer Vibes" exceeded budget limit', time: '2h', seen: false },
    { id: 2, text: 'New high-performing audience segment identified', time: '5h', seen: false },
    { id: 3, text: 'Weekly campaign report is ready', time: '1d', seen: true },
    { id: 4, text: 'Your ad approval status updated', time: '2d', seen: true },
  ]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Campaign state
  const [selectedMetric, setSelectedMetric] = useState('impressions');
  const [campaigns, setCampaigns] = useState(campaignsData);

  // Profile dropdown helper functions
  const getUserDisplayName = () => {
    return 'MegaCorp Marketing';
  };

  const getUserAvatar = () => {
    return null;
  };

  const getTotalBudget = () => {
    return campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  };

  // Mark notifications as seen when opened
  useEffect(() => {
    if (showNotifications) {
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    }
  }, [showNotifications]);

  // Handle click outside to close notifications
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

  // Handle profile dropdown clicks outside
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

  // Handle user icon click
  const handleUserIconClick = () => {
    if (isUserLoggedIn) {
      setShowProfileDropdown(!showProfileDropdown);
    } else {
      router.push('/login');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return '$' + formatNumber(num);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'spend' ? formatCurrency(entry.value) : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleCampaignStatus = (campaignId: number) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        return { ...campaign, status: newStatus };
      }
      return campaign;
    }));
  };

  const handleCreateCampaign = () => {
    setShowCreateCampaign(true);
  };

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
                placeholder="Search campaigns..."
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
              → Ad Manager
            </button>
          </div>
          
          {/* User Icon with Profile Dropdown */}
          <div className='text-black align-baseline hidden lg:block relative'>
            <button 
              ref={userIconRef}
              onClick={handleUserIconClick}
              className={`p-2 rounded-lg transition-colors ${
                isUserLoggedIn 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
              aria-label={isUserLoggedIn ? "User profile" : "Login"}
            >
              {isUserLoggedIn && getUserAvatar() ? (
                <img 
                  src={getUserAvatar() || ""} 
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">{formatCurrency(getTotalBudget())} total budget</span>
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
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{getUserDisplayName()}</div>
                      <div className="text-sm text-gray-500 truncate">Advertiser Account</div>
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
            aria-label="Notifications"
         >
           <Bell size={24} className="text-gray-700" />
           {notifications.some(n => !n.seen) && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
         </button>
        )}
      </div>

      {/* Main Content - Advertiser Dashboard */}
      <div className="ml-12 sm:ml-16 px-4 py-6 pt-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your advertising campaigns and track performance</p>
            </div>
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
                onClick={handleCreateCampaign}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Create Campaign
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spend</p>
                  <p className="text-2xl font-bold text-gray-900">$11,650</p>
                  <p className="text-sm text-green-600 mt-1">+8.2% from last week</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Impressions</p>
                  <p className="text-2xl font-bold text-gray-900">910K</p>
                  <p className="text-sm text-green-600 mt-1">+12.5% from last week</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">4.2%</p>
                  <p className="text-sm text-red-600 mt-1">-0.3% from last week</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MousePointer className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold text-gray-900">567</p>
                  <p className="text-sm text-green-600 mt-1">+15.7% from last week</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Campaign Performance Over Time */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
                <div className="flex gap-2">
                  {['impressions', 'clicks', 'conversions', 'spend'].map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedMetric === metric
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Audience Demographics */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Audience Demographics</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={audienceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {audienceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {audienceData.map((audience, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: audience.color }}
                        />
                        <span className="text-sm text-gray-700">{audience.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{audience.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Management</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter size={16} className="inline mr-1" />
                  Filter
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download size={16} className="inline mr-1" />
                  Export
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCampaignStatus(campaign.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 hover:bg-green-200' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="w-4 h-4 text-green-600" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(campaign.spent)}</div>
                      <div className="text-xs text-gray-500">of {formatCurrency(campaign.budget)}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{formatNumber(campaign.impressions)}</div>
                      <div className="text-xs text-gray-500">impressions</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{formatNumber(campaign.clicks)}</div>
                      <div className="text-xs text-gray-500">{campaign.ctr}% CTR</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{campaign.conversions}</div>
                      <div className="text-xs text-gray-500">conversions</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedCampaign(campaign)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit campaign"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
                <button 
                  onClick={() => setShowCreateCampaign(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input 
                  type="text"
                  placeholder="Enter campaign name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>7 days</option>
                    <option>14 days</option>
                    <option>30 days</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="age-18-24" />
                    <label htmlFor="age-18-24" className="text-sm text-gray-700">18-24 years old</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="age-25-34" />
                    <label htmlFor="age-25-34" className="text-sm text-gray-700">25-34 years old</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="age-35-44" />
                    <label htmlFor="age-35-44" className="text-sm text-gray-700">35-44 years old</label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Objective</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Brand Awareness</option>
                  <option>Website Traffic</option>
                  <option>Engagement</option>
                  <option>Conversions</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateCampaign(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Handle campaign creation
                  setShowCreateCampaign(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowNotifications(false)}
          />

          <div
            ref={notificationsRef}
            className="notification-panel fixed inset-0 bg-white z-50 overflow-y-auto transition-opacity duration-300 ease-in-out lg:hidden"
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold">Campaign Updates</h3>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-0">
              {notifications.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No new updates</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.seen ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      console.log('Clicked notification:', notif);
                      setNotifications(prev => prev.map(n => 
                        n.id === notif.id ? { ...n, seen: true } : n
                      ));
                      setShowNotifications(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 font-medium line-clamp-2">
                          {notif.text}
                        </span>
                        <div className="flex items-center ml-2 flex-shrink-0">
                          {!notif.seen && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          )}
                          <span className="text-xs text-gray-400">
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="notification-panel hidden lg:block fixed bg-white z-50 w-80 rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto transition-opacity duration-300 ease-in-out"
            style={{
              left: '5rem',
              top: isHeaderVisible ? '5rem' : '1rem'
            }}
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200 shadow-sm rounded-t-lg">
              <h3 className="text-lg font-semibold">Campaign Updates</h3>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-0">
              {notifications.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No new updates</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.seen ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      console.log('Clicked notification:', notif);
                      setNotifications(prev => prev.map(n => 
                        n.id === notif.id ? { ...n, seen: true } : n
                      ));
                      setShowNotifications(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 font-medium line-clamp-2">
                          {notif.text}
                        </span>
                        <div className="flex items-center ml-2 flex-shrink-0">
                          {!notif.seen && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          )}
                          <span className="text-xs text-gray-400">
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdvertiserDashboard;