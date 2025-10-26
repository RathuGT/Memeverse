'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Bell, X, Calendar, MoreHorizontal, Share, Flag, MessageCircle, Eye, Settings, UserPlus, UserCheck, Upload, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

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
  category_id: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_featured: boolean;
  views_count: number;
  smiles_count: number;
  comments_count: number;
  shares_count: number;
  visibility: string;
}

interface UserProfile {
  user_id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  user_type: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  email_verified: boolean;
  profile_visibility: string;
  total_smiles_received: number;
  total_memes_created: number;
  leaderboard_points: number;
}

interface MemeCardProps {
  meme: Meme;
  onClick?: () => void;
}

const MemeCard: React.FC<MemeCardProps> = React.memo(({ meme, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasObserved = useRef(false);

  useEffect(() => {
    if (!cardRef.current || hasObserved.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            hasObserved.current = true;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '400px' }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', meme.image_url);
    setImageError(true);
  };

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg mb-4 break-inside-avoid cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 relative"
      onClick={onClick}
    >
      {!imageError ? (
        <div className="relative">
          {!imageLoaded && (
            <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center">
              {isVisible && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              )}
            </div>
          )}
          
          {isVisible && (
            <img
              src={meme.thumbnail_url || meme.image_url}
              alt={meme.title}
              className={`w-full h-auto object-cover transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      ) : (
        <div className="w-full aspect-[4/5] bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center text-gray-600 p-4">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-sm font-medium mb-1">{meme.title}</div>
            <div className="text-xs text-gray-500">Image unavailable</div>
          </div>
        </div>
      )}
      
      {imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-end p-3 opacity-0 hover:opacity-100">
          <div className="text-white w-full">
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{meme.title}</h3>
            {meme.description && (
              <p className="text-xs text-gray-200 mt-1 line-clamp-1 mb-2">{meme.description}</p>
            )}
            <div className="flex justify-between items-center text-xs">
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {meme.views_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                   <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                  </svg>
                    {meme.smiles_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {meme.comments_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.meme.meme_id === nextProps.meme.meme_id;
});

MemeCard.displayName = 'MemeCard';

const ProfilePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [columns, setColumns] = useState(3);
  const [activeTab, setActiveTab] = useState('created');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const selectedRef = useRef<HTMLDivElement | null>(null);

  // Auth & User State
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Memes State
  const [userMemes, setUserMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [memesLoading, setMemesLoading] = useState(false);

  // UI State
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
  });

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Someone liked your meme', time: '2h', seen: false },
    { id: 2, text: 'New follower!', time: '5h', seen: false },
  ]);

  const router = useRouter();

  // Refs
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const optionsOverlayRef = useRef<HTMLDivElement>(null);
  const optionsIconRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateMemes = () => router.push('/create');
  const handleLeaderboard = () => router.push('/leaderboard');

  // Format numbers for display
  const formatNumber = (num: number | null | undefined) => {
    const n = num || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  // Fetch Auth State
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('Starting auth check...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        console.log('Session:', session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);
          
          console.log('Fetching profile for user:', session.user.id);
          
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          console.log('Profile fetch result:', { profile, error: profileError });
          
          if (profileError) {
            console.error('Profile error:', profileError);
            // If profile doesn't exist, we still set loading to false
            setLoading(false);
            return;
          }
          
          if (profile) {
            console.log('Profile found:', profile.username);
            setCurrentUserProfile(profile);
            setProfileUser(profile);
            setIsOwnProfile(true);
            setEditForm({
              username: profile.username || '',
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              bio: profile.bio || '',
            });
          }
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setIsUserLoggedIn(true);
          
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            setCurrentUserProfile(profile);
            setProfileUser(profile);
            setIsOwnProfile(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsUserLoggedIn(false);
          setCurrentUserProfile(null);
          setProfileUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Fetch User Memes
  useEffect(() => {
    const fetchUserMemes = async () => {
      if (!profileUser) {
        console.log('No profileUser, skipping memes fetch');
        return;
      }
      
      console.log('Fetching memes for user:', profileUser.user_id);
      setMemesLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('meme')
          .select('*')
          .eq('creator_id', profileUser.user_id)
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Memes fetch error:', error);
          throw error;
        }
        
        console.log('Memes fetched:', data?.length || 0);
        setUserMemes(data || []);
      } catch (error) {
        console.error('Error fetching memes:', error);
        setUserMemes([]); // Set empty array on error
      } finally {
        console.log('Memes loading complete');
        setMemesLoading(false);
      }
    };

    fetchUserMemes();
  }, [profileUser]);

  // Check Follow Status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !profileUser || isOwnProfile) return;
      
      try {
        const { data } = await supabase
          .from('user_follow')
          .select('follow_id')
          .eq('follower_id', user.id)
          .eq('following_id', profileUser.user_id)
          .single();
        
        setIsFollowing(!!data);
      } catch (error) {
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [user, profileUser, isOwnProfile]);

  // Handle Follow/Unfollow
  const handleFollowToggle = async () => {
    if (!user || !profileUser) return;

    try {
      if (isFollowing) {
        await supabase
          .from('user_follow')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileUser.user_id);
        
        setIsFollowing(false);
      } else {
        await supabase
          .from('user_follow')
          .insert({
            follower_id: user.id,
            following_id: profileUser.user_id
          });
        
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Handle Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfileUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setCurrentUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(editForm)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfileUser(prev => prev ? { ...prev, ...editForm } : null);
      setCurrentUserProfile(prev => prev ? { ...prev, ...editForm } : null);
      setShowEditModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  // Header hide/show
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
    if (selectedPost) {
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
  }, [selectedPost]);

  // Column count responsive
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 768) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1280) setColumns(4);
      else setColumns(5);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showMoreOptions && moreOptionsRef.current && !moreOptionsRef.current.contains(target) &&
          moreButtonRef.current && !moreButtonRef.current.contains(target)) {
        setShowMoreOptions(false);
      }

      if (showProfileDropdown && profileDropdownRef.current && !profileDropdownRef.current.contains(target) &&
          userIconRef.current && !userIconRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }

      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target) &&
          !(event.target as HTMLElement).closest('.notification-panel')) {
        setShowNotifications(false);
      }

      if (showOptionsOverlay && optionsOverlayRef.current && !optionsOverlayRef.current.contains(target) &&
          optionsIconRef.current && !optionsIconRef.current.contains(target)) {
        setShowOptionsOverlay(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreOptions, showProfileDropdown, showNotifications, showOptionsOverlay]);

  useEffect(() => {
    if (showNotifications) {
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    }
  }, [showNotifications]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileDropdown(false);
    router.push('/');
  };

  const handleUserIconClick = () => {
    if (isUserLoggedIn) {
      setShowProfileDropdown(!showProfileDropdown);
    } else {
      router.push('/login');
    }
  };

  const handleOptionsIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsOverlay(!showOptionsOverlay);
  };

  const getUserDisplayName = () => {
    if (currentUserProfile?.username) return currentUserProfile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    return currentUserProfile?.avatar_url || null;
  };

  const getSmileCount = () => {
    return currentUserProfile?.total_smiles_received || 0;
  };

  // Filter memes
  const filteredMemes = useMemo(() => {
    return userMemes.filter(meme => 
      meme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meme.description && meme.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [userMemes, searchQuery]);

  const memesGrid = useMemo(() => {
    return filteredMemes;
  }, [filteredMemes]);

  const selectedMeme = selectedPost ? userMemes.find(meme => meme.meme_id === selectedPost) : null;
  const otherMemes = selectedPost ? userMemes.filter(meme => meme.meme_id !== selectedPost) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isUserLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Your profile hasn't been created yet. This might be a database issue.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

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

          <div className="text-black align-baseline hidden lg:block relative">
            <button
              ref={userIconRef}
              onClick={handleUserIconClick}
              className={`p-2 rounded-lg transition-colors ${
                isUserLoggedIn ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'hover:bg-gray-100'
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
          {/* Profile Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="relative mb-4">
                  {profileUser.avatar_url ? (
                    <img
                      src={profileUser.avatar_url}
                      alt={profileUser.username}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                      {profileUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      ) : (
                        <Camera size={16} />
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-2 mb-4 md:mb-0">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Settings size={16} />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFollowToggle}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isFollowing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Share size={16} />
                      </button>
                    </>
                  )}

                  <div className="relative">
                    <button
                      ref={moreButtonRef}
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {showMoreOptions && (
                      <div
                        ref={moreOptionsRef}
                        className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 w-40"
                      >
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2">
                          <Share size={14} />
                          Copy Link
                        </button>
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600 flex items-center gap-2">
                          <Flag size={14} />
                          Report User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileUser.first_name && profileUser.last_name
                      ? `${profileUser.first_name} ${profileUser.last_name}`
                      : profileUser.username}
                  </h1>
                </div>

                <p className="text-gray-600 text-sm mb-1">@{profileUser.username}</p>

                {profileUser.bio && (
                  <p className="text-gray-700 mb-4 leading-relaxed">{profileUser.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    Joined {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{formatNumber(profileUser.total_memes_created)}</div>
                    <div className="text-gray-600">Memes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{formatNumber(profileUser.total_smiles_received)}</div>
                    <div className="text-gray-600">Smiles</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{formatNumber(profileUser.leaderboard_points)}</div>
                    <div className="text-gray-600">Points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'created'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Created ({formatNumber(profileUser.total_memes_created)})
              </button>
            </div>
          </div>

          {/* Memes Grid */}
          {memesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading memes...</p>
            </div>
          ) : filteredMemes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No memes yet</h3>
              <p className="text-gray-600">
                {isOwnProfile ? "You haven't posted any memes yet" : `${profileUser.username} hasn't posted any memes yet`}
              </p>
            </div>
          ) : (
            <div
              className="w-full"
              style={{ 
                columns: `${columns} 250px`,
                columnGap: '16px',
              }}
            >
              {memesGrid.map((meme) => (
                <div 
                  key={meme.meme_id}
                  className="mb-4"
                  style={{ 
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid'
                  }}
                >
                  <MemeCard
                    meme={meme}
                    onClick={() => {
                      setScrollPosition(window.scrollY);
                      setSelectedPost(meme.meme_id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="min-h-full flex items-center justify-center p-4">
              <div 
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Selected Meme Modal */}
      {selectedMeme && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50"
            onClick={() => {
              setSelectedPost(null);
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
                    setSelectedPost(null);
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
                      <Eye className="w-4 h-4" />
                      {selectedMeme.views_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                       <circle cx="12" cy="12" r="10" />
                       <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                      </svg>
                        {selectedMeme.smiles_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
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
              {notifications.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No new updates</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      !notif.seen ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setShowNotifications(false)}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{notif.text}</span>
                        <span className="text-xs text-gray-400 ml-2">{notif.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
              {notifications.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No new updates</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      !notif.seen ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setShowNotifications(false)}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{notif.text}</span>
                        <span className="text-xs text-gray-400 ml-2">{notif.time}</span>
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

export default ProfilePage;