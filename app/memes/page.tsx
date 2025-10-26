'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Bell, X } from "lucide-react"
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
  height?: number;
}

interface MemeCardProps {
  meme: Meme;
  onClick?: () => void;
}

interface ValidationErrors {
  email?: string | null;
  password?: string | null;
  general?: string | null;
}

interface BookmarkState {
  isBookmarked: boolean;
  bookmarkId?: string;
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
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  

  const handleImageError = () => {
    console.error('Failed to load image:', meme.image_url, 'for meme:', meme.title);
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
          {/* Placeholder - only show when image hasn't loaded */}
          {!imageLoaded && (
            <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center">
              {isVisible && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              )}
            </div>
          )}
          
          {/* Image - always render so it can load */}
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
          <div className="text-white">
            <h3 className="font-semibold text-sm line-clamp-2">{meme.title}</h3>
            {meme.description && (
              <p className="text-xs text-gray-200 mt-1 line-clamp-1">{meme.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.meme.meme_id === nextProps.meme.meme_id;
});

MemeCard.displayName = 'MemeCard';




const MemeVerse: React.FC = () => {
  const [columns, setColumns] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const commentInputRef = useRef<HTMLDivElement>(null);

  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const optionsOverlayRef = useRef<HTMLDivElement>(null);
  const optionsIconRef = useRef<HTMLButtonElement>(null);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const userIconRef = useRef<HTMLButtonElement>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [hasNotifications, setHasNotifications] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const router = useRouter();

  const handleCreateMemes = () => {
    router.push('/edit-create');
  };

  const handleLoadProfile = () => {
    router.push('/profile');
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard');
  };

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

  const lastScrollTopRef = useRef(0);
  const isLoadingRef = useRef(false);

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

  const fetchMemes = async (pageNum: number = 0, searchTerm: string = '') => {
    try {
      setLoading(pageNum === 0);
      
      let query = supabase
        .from('meme')
        .select('*')
        .eq('is_published', true)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(pageNum * 12, (pageNum * 12) + 11);

      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (pageNum === 0) {
        setMemes(data || []);
        if (data && data.length > 0) {
          sessionStorage.setItem('cachedMemes', JSON.stringify(data));
        }
      } else {
        const newMemes = [...memes, ...(data || [])];
        setMemes(newMemes);
        if (newMemes.length > 0) {
          sessionStorage.setItem('cachedMemes', JSON.stringify(newMemes.slice(0, 36)));
        }
      }

      setHasMore((data || []).length === 12);
      setError(null);
    } catch (err) {
      console.error('Error fetching memes:', err);
      setError('Failed to load memes. Please try again.');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    lastScrollTopRef.current = 0;
    isLoadingRef.current = false;
    
    const cachedMemes = sessionStorage.getItem('cachedMemes');
    if (cachedMemes) {
      try {
        const parsed = JSON.parse(cachedMemes);
        setMemes(parsed);
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse cached memes:', e);
      }
    }
    
    fetchMemes(0, searchQuery);
  }, []);
  

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        const cachedMemes = sessionStorage.getItem('cachedMemes');
        if (cachedMemes && memes.length === 0) {
          try {
            setMemes(JSON.parse(cachedMemes));
          } catch (e) {
            console.error('Failed to restore cached memes:', e);
          }
        }
      }
      setPage(0);
      lastScrollTopRef.current = 0;
      isLoadingRef.current = false;
      fetchMemes(0, searchQuery);
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let lastTriggerTime = 0;
    
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (currentScrollTop <= lastScrollTopRef.current) {
        lastScrollTopRef.current = currentScrollTop;
        return;
      }
      
      lastScrollTopRef.current = currentScrollTop;
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        const now = Date.now();
        if (isLoadingRef.current || (now - lastTriggerTime < 1000)) {
          return;
        }
        
        if (
          window.innerHeight + document.documentElement.scrollTop
          >= document.documentElement.offsetHeight - 800 &&
          !loading &&
          hasMore
        ) {
          lastTriggerTime = now;
          isLoadingRef.current = true;
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMemes(nextPage, searchQuery);
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [loading, hasMore, page, searchQuery]);


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




  // Around line 435 - replace the memesGrid useMemo
  const memesGrid = useMemo(() => {
    return memes;
  }, [memes]);

  const getRelatedMemes = (currentMemeId: string) => {
    return memes.filter(meme => meme.meme_id !== currentMemeId).slice(0, 10);
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

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchCreatorProfile = async (creatorId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, first_name, last_name, avatar_url')
      .eq('user_id', creatorId)
      .single();
    
    if (error) {
      console.error('Error fetching creator profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return null;
  }
  };

  // Check if user has reacted to a meme
const checkUserReaction = async (memeId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('reaction')
      .select('reaction_id, reaction_type')
      .eq('meme_id', memeId)
      .eq('user_id', userId)
      .eq('reaction_type', 'smile')
      .single();
    
    return data ? true : false;
  } catch (error) {
    return false;
  }
};

// Toggle reaction on a meme
const toggleReaction = async (memeId: string) => {
  if (!user) {
    alert('Please log in to react to memes!');
    return;
  }

  try {
    // Get the meme's creator first
    const { data: meme } = await supabase
      .from('meme')
      .select('creator_id, smiles_count')
      .eq('meme_id', memeId)
      .single();
    
    if (!meme) return;

    // Check if user already reacted
    const { data: existingReaction } = await supabase
      .from('reaction')
      .select('reaction_id')
      .eq('meme_id', memeId)
      .eq('user_id', user.id)
      .eq('reaction_type', 'smile')
      .maybeSingle();

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from('reaction')
        .delete()
        .eq('reaction_id', existingReaction.reaction_id);
      
      // Decrement meme smiles count
      await supabase
        .from('meme')
        .update({ smiles_count: Math.max(0, meme.smiles_count - 1) })
        .eq('meme_id', memeId);
      
      // Decrement creator's total smiles received
      const { data: creatorProfile } = await supabase
        .from('user_profiles')
        .select('total_smiles_received')
        .eq('user_id', meme.creator_id)
        .single();
      
      if (creatorProfile) {
        await supabase
          .from('user_profiles')
          .update({ 
            total_smiles_received: Math.max(0, creatorProfile.total_smiles_received - 1) 
          })
          .eq('user_id', meme.creator_id);
      }
      
      // Update local state - REMOVE from set
      setUserReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(memeId);
        return newSet;
      });
      
      setMemes(prev => prev.map(m => 
        m.meme_id === memeId 
          ? { ...m, smiles_count: Math.max(0, m.smiles_count - 1) }
          : m
      ));
      
      // Update userProfile if it's the current user's profile
      if (userProfile && userProfile.user_id === meme.creator_id) {
        const updatedProfile = {
          ...userProfile,
          total_smiles_received: Math.max(0, userProfile.total_smiles_received - 1)
        };
        setUserProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
      
      console.log('Reaction removed');
    } else {
      // Add reaction
      await supabase
        .from('reaction')
        .insert({
          user_id: user.id,
          meme_id: memeId,
          reaction_type: 'smile'
        });
      
      // Increment meme smiles count
      await supabase
        .from('meme')
        .update({ smiles_count: meme.smiles_count + 1 })
        .eq('meme_id', memeId);
      
      // Increment creator's total smiles received
      const { data: creatorProfile } = await supabase
        .from('user_profiles')
        .select('total_smiles_received')
        .eq('user_id', meme.creator_id)
        .single();
      
      if (creatorProfile) {
        await supabase
          .from('user_profiles')
          .update({ 
            total_smiles_received: creatorProfile.total_smiles_received + 1 
          })
          .eq('user_id', meme.creator_id);
      }
      
      // Update local state - ADD to set
      setUserReactions(prev => {
        const newSet = new Set(prev);
        newSet.add(memeId);
        return newSet;
      });
      
      setMemes(prev => prev.map(m => 
        m.meme_id === memeId 
          ? { ...m, smiles_count: m.smiles_count + 1 }
          : m
      ));
      
      // Update userProfile if it's the current user's profile
      if (userProfile && userProfile.user_id === meme.creator_id) {
        const updatedProfile = {
          ...userProfile,
          total_smiles_received: userProfile.total_smiles_received + 1
        };
        setUserProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
      
      console.log('Reaction added');
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    alert('Failed to react. Please try again.');
  }
};

// Fetch comments for a meme
const fetchComments = async (memeId: string) => {
  console.log('🔍 Fetching comments for meme:', memeId);
  
  try {
    // Fetch comments
    const { data: comments, error } = await supabase
      .from('comment')
      .select('*')
      .eq('meme_id', memeId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching comments:', error);
      return;
    }
    
    console.log('✅ Main comments fetched:', comments?.length || 0, 'comments');
    
    // Fetch user profiles separately
    const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, username, first_name, last_name, avatar_url')
      .in('user_id', userIds);
    
    // Create a map of user profiles
    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    // Attach profiles to comments
    const commentsWithProfiles = comments?.map(comment => ({
      ...comment,
      user_profiles: profilesMap.get(comment.user_id)
    })) || [];
    
    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      commentsWithProfiles.map(async (comment) => {
        const { data: replies } = await supabase
          .from('comment')
          .select('*')
          .eq('parent_comment_id', comment.comment_id)
          .order('created_at', { ascending: true });
        
        // Attach profiles to replies
        const repliesWithProfiles = replies?.map(reply => ({
          ...reply,
          user_profiles: profilesMap.get(reply.user_id)
        })) || [];
        
        return { ...comment, replies: repliesWithProfiles };
      })
    );
    
    console.log('✅ Total comments with replies:', commentsWithReplies.length);
    setComments(commentsWithReplies);
  } catch (error) {
    console.error('❌ Exception fetching comments:', error);
  }
};
// Post a new comment
const postComment = async (memeId: string, content: string, parentCommentId: string | null = null) => {
  if (!user) {
    alert('Please log in to comment!');
    return;
  }
  
  if (!content.trim()) {
    alert('Comment cannot be empty!');
    return;
  }
  
  setIsPostingComment(true);
  
  try {
    // Insert comment
    const { data: newCommentData, error } = await supabase
      .from('comment')
      .insert({
        meme_id: memeId,
        user_id: user.id,
        parent_comment_id: parentCommentId,
        content: content.trim()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Comment posted:', newCommentData); // DEBUG
    
    // Update meme comments count
    const { data: currentMeme } = await supabase
      .from('meme')
      .select('comments_count')
      .eq('meme_id', memeId)
      .single();
    
    const newCount = (currentMeme?.comments_count || 0) + 1;
    
    await supabase
      .from('meme')
      .update({ comments_count: newCount })
      .eq('meme_id', memeId);
    
    // Update local state
    setMemes(prev => prev.map(m => 
      m.meme_id === memeId 
        ? { ...m, comments_count: newCount }
        : m
    ));
    
    // Refresh comments
    await fetchComments(memeId);
    
    // Clear input
    if (parentCommentId) {
      setReplyText('');
      setReplyingTo(null);
    } else {
      setNewComment('');
    }
    
    console.log('Comment posted successfully');
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Failed to post comment. Please try again.');
  } finally {
    setIsPostingComment(false);
  }
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

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

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

  const checkRateLimit = () => {
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
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchResults, setSearchResults] = useState< {
    memes: Meme[];
      users: any[];
  }>({ memes: [], users: [] });

  // Search for memes and users
const performSearch = async (query: string) => {
  if (!query.trim()) {
    setSearchResults({ memes: [], users: [] });
    return;
  }
  
  setIsSearching(true);
  
  try {
    // Search memes
    const { data: memesData } = await supabase
      .from('meme')
      .select('*')
      .eq('is_published', true)
      .eq('visibility', 'public')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(6);
    
    // Search users
    const { data: usersData } = await supabase
      .from('user_profiles')
      .select('user_id, username, first_name, last_name, avatar_url, bio, total_memes_created')
      .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(4);
    
    setSearchResults({
      memes: memesData || [],
      users: usersData || []
    });
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    setIsSearching(false);
  }
};

// Debounced search
useEffect(() => {
  if (showSearchOverlay) {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }
}, [searchQuery, showSearchOverlay]);
const [isSearching, setIsSearching] = useState(false);
const searchInputRef = useRef<HTMLInputElement>(null);
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
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (loginError) {
        throw loginError;
      }

      setLoginAttempts(0);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      setIsUserLoggedIn(true);
      
    } catch (error: any) {
      setLoginAttempts(prev => prev + 1);
      setErrors({ 
        general: error.message === "Invalid login credentials" 
          ? "Invalid email or password" 
          : "Login failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!checkRateLimit()) {
      setErrors({ general: "Too many failed attempts. Please wait." });
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setErrors({ general: "Google login failed. Please try again." });
    }
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    setEmail('');
    setPassword('');
    setErrors({});
    setIsLoading(false);
  };

  const [bookmarkedMemes, setBookmarkedMemes] = useState<Map<string, BookmarkState>>(new Map());
  // Check if user has bookmarked a meme
const checkBookmark = async (memeId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookmark')
      .select('bookmark_id')
      .eq('meme_id', memeId)
      .eq('user_id', userId)
      .maybeSingle();
    
    return data ? { isBookmarked: true, bookmarkId: data.bookmark_id } : { isBookmarked: false };
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return { isBookmarked: false };
  }
};

// Toggle bookmark on a meme
const toggleBookmark = async (memeId: string) => {
  if (!user) {
    alert('Please log in to bookmark memes!');
    return;
  }

  try {
    const currentBookmark = bookmarkedMemes.get(memeId);

    if (currentBookmark?.isBookmarked && currentBookmark.bookmarkId) {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmark')
        .delete()
        .eq('bookmark_id', currentBookmark.bookmarkId);
      
      if (error) throw error;
      
      // Update local state
      setBookmarkedMemes(prev => {
        const newMap = new Map(prev);
        newMap.delete(memeId);
        return newMap;
      });
      
      console.log('Bookmark removed');
    } else {
      // Add bookmark
      const { data, error } = await supabase
        .from('bookmark')
        .insert({
          user_id: user.id,
          meme_id: memeId,
          folder_name: 'Default' // You can make this dynamic later
        })
        .select('bookmark_id')
        .single();
      
      if (error) throw error;
      
      // Update local state
      setBookmarkedMemes(prev => {
        const newMap = new Map(prev);
        newMap.set(memeId, { isBookmarked: true, bookmarkId: data.bookmark_id });
        return newMap;
      });
      
      console.log('Bookmark added');
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    alert('Failed to bookmark. Please try again.');
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
    if (showLoginModal) {
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseLogin();
        }
        
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
      document.body.style.overflow = 'unset';
    }
  }, [showLoginModal]);

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

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);        // Changed from 2 to 1
      else if (width < 768) setColumns(2);   // Added breakpoint
      else if (width < 1024) setColumns(3);
      else if (width < 1280) setColumns(4);
      else setColumns(5);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  

  const selectedMeme = selectedPost ? memes.find(meme => meme.meme_id === selectedPost) : null;
  const relatedMemes = selectedPost ? getRelatedMemes(selectedPost) : [];
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
      if (selectedMeme) {
        fetchCreatorProfile(selectedMeme.creator_id).then(profile => {
         setCreatorProfile(profile);
       });
     } else {
       setCreatorProfile(null);
      }
    }, [selectedMeme]);


    useEffect(() => {
  if (selectedMeme) {
    fetchComments(selectedMeme.meme_id);
    } else {
    setComments([]);
    setNewComment('');
    setReplyingTo(null);
    setReplyText('');
    }
  }, [selectedMeme]);

  useEffect(() => {
  if (selectedMeme && user) {
    checkUserReaction(selectedMeme.meme_id, user.id).then(hasReacted => {
      setUserReactions(prev => {
        const newSet = new Set(prev);
        if (hasReacted) {
          newSet.add(selectedMeme.meme_id);
        } else {
          newSet.delete(selectedMeme.meme_id);
        }
        return newSet;
      });
    });
    }
  }, [selectedMeme, user]);

  useEffect(() => {
  if (selectedMeme && user) {
    checkBookmark(selectedMeme.meme_id, user.id).then(bookmarkState => {
      setBookmarkedMemes(prev => {
        const newMap = new Map(prev);
        if (bookmarkState.isBookmarked) {
          newMap.set(selectedMeme.meme_id, bookmarkState);
        } else {
          newMap.delete(selectedMeme.meme_id);
        }
        return newMap;
      });
    });
  }
}, [selectedMeme, user]);

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
                  placeholder="Search memes and users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => setShowSearchOverlay(true)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
          </div>
          
          {/* User Icon with Profile Dropdown */}
          <div className='text-black align-baseline hidden lg:block relative'>
            <button 
              ref={userIconRef}
              onClick={handleUserIconClick}
              className={`p-2 rounded-lg transition-colors ${
                isUserLoggedIn 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'hover:bg-gray-100'
              }`}
              aria-label={isUserLoggedIn ? "User profile" : "Login"}
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
                    <button className="p-1 hover:bg-gray-100 rounded" onClick={handleLoadProfile} title="Load Profile">
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
                    <div className="relative">
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
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{getUserDisplayName()}</div>
                      <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">Settings</span>
                    </button>

                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span className="text-sm font-medium">Dark Mode</span>
                      </div>
                      <button className="w-12 h-6 bg-blue-500 rounded-full p-1 transition-colors">
                        <div className="w-4 h-4 bg-white rounded-full transform translate-x-6 transition-transform"></div>
                      </button>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
{showSearchOverlay && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
      onClick={() => {
        setShowSearchOverlay(false);
        setSearchQuery('');
        setSearchResults({ memes: [], users: [] });
      }}
    />
    
    {/* Search Overlay Panel */}
    <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
      <div className="max-w-4xl mx-auto mt-4 px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for memes, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 rounded-full text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button 
                onClick={() => {
                  setShowSearchOverlay(false);
                  setSearchQuery('');
                  setSearchResults({ memes: [], users: [] });
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Search Results */}
          <div className="max-h-[70vh] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {searchQuery.trim() === '' ? (
                  <div className="py-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-lg font-medium">Start typing to search</p>
                    <p className="text-sm mt-1">Find memes and users instantly</p>
                  </div>
                ) : (
                  <>
                    {/* Users Results */}
                    {searchResults.users.length > 0 && (
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Users</h3>
                        <div className="space-y-3">
                          {searchResults.users.map((user) => (
                            <div
                              key={user.user_id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                              onClick={() => {
                                setShowSearchOverlay(false);
                                setSearchQuery('');
                                // For now just close overlay - profile page coming later
                                console.log('Clicked user:', user.username);
                              }}
                            >
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.username} 
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User size={24} className="text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">
                                  {user.username || `${user.first_name} ${user.last_name}`}
                                </p>
                                {user.bio && (
                                  <p className="text-sm text-gray-500 truncate">{user.bio}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {user.total_memes_created} memes
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Memes Results */}
                    {searchResults.memes.length > 0 && (
                      <div className="p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Memes</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {searchResults.memes.map((meme) => (
                            <div
                              key={meme.meme_id}
                              className="cursor-pointer group"
                              onClick={() => {
                                setShowSearchOverlay(false);
                                setSearchQuery('');
                                setSearchResults({ memes: [], users: [] });
                                setSelectedPost(meme.meme_id);
                              }}

                            >
                              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={meme.image_url}
                                  alt={meme.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-end p-2">
                                  <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                    {meme.title}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{meme.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                      <circle cx="12" cy="12" r="10" />
                                      <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                                    </svg>
                                    {meme.smiles_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {meme.comments_count}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No Results */}
                    {searchResults.memes.length === 0 && searchResults.users.length === 0 && (
                      <div className="py-12 text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm mt-1">Try searching with different keywords</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
)}

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
      {/* Main Content */}
      <div className="ml-12 sm:ml-16 px-4 py-6 pt-24">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => fetchMemes(0, searchQuery)}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && memes.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading memes...</p>
            </div>
          )}

          {!loading && memes.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No memes found</p>
              {searchQuery && (
                <p className="text-gray-500 mt-2">Try a different search term</p>
              )}
            </div>
          )}

          {/* Pinterest-Style Modal */}
          {selectedMeme && (
  <>
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50"
      onClick={() => {
         setSelectedPost(null);
          // Restore scroll position after modal closes
         setTimeout(() => {
            window.scrollTo(0, scrollPosition);
         }, 0);
        }}
    />
    
    <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-[90vw] pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setSelectedPost(null);
              // Restore scroll position after modal closes
             setTimeout(() => {
               window.scrollTo(0, scrollPosition);
             }, 0);
            }}
            className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-700" />
          </button>

          <div className="flex flex-col lg:flex-row h-[95vh]">
            {/* Left side - Image */}
            <div className="lg:w-3/5 bg-black flex flex-col items-center justify-center p-4 lg:p-8">
              <img
                src={selectedMeme.image_url}
                alt={selectedMeme.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
              <div className="mt-4 text-center max-w-2xl">
                <h2 className="text-xl font-bold text-white mb-2">{selectedMeme.title}</h2>
                {selectedMeme.description && (
                  <p className="text-gray-300 text-sm">{selectedMeme.description}</p>
                )}
              </div>
            </div>

            {/* Right side - Comments AND Related Memes */}
            <div className="lg:w-2/5 flex flex-col bg-white overflow-hidden relative z-10">
              {/* Header with creator info */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {creatorProfile?.avatar_url ? (
                      <img 
                        src={creatorProfile.avatar_url} 
                        alt={creatorProfile.username || 'Creator'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {creatorProfile?.username || creatorProfile?.first_name || 'Creator'}
                      </p>
                      <p className="text-xs">{new Date(selectedMeme.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mr-0 lg:mr-12">
                     <button 
                       onClick={handleOptionsIconClick}
                       className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-black text-2xl font-bold leading-none"
                     >
                        ⋮
                     </button>
                     <button 
                       onClick={(e) => {
                          e.stopPropagation();
                         toggleBookmark(selectedMeme.meme_id);
                       }}
                       className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                       title={bookmarkedMemes.get(selectedMeme.meme_id)?.isBookmarked ? "Remove bookmark" : "Bookmark"}
                      >
                       <svg 
                         className="w-6 h-6 text-black" 
                          fill={bookmarkedMemes.get(selectedMeme.meme_id)?.isBookmarked ? "currentColor" : "none"}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                       >
                         <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                           strokeWidth={2} 
                           d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                         />
                       </svg>
                      </button>
                  </div>
                </div>
                
                {/* Reaction buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleReaction(selectedMeme.meme_id)}
                    className="transition-all hover:scale-110 flex items-center gap-1"
                  >
                    <svg 
                      className="w-6 h-6" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2}
                    >
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        fill={userReactions.has(selectedMeme.meme_id) ? "#EAB308" : "none"}
                        stroke="currentColor"
                        className="text-black"
                      />
                      <path 
                        strokeLinecap="round" 
                        d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
                        stroke="currentColor"
                        className="text-black"
                        fill="none"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-800">{selectedMeme.smiles_count.toLocaleString()}</span>
                  </button>
                  
                  <button
                     onClick={() => {
                       commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                       setTimeout(() => {
                          commentInputRef.current?.querySelector('input')?.focus();
                       }, 300);
                     }}
                     className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                      >
                     <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                     </svg>
                     <span className="text-sm font-medium text-gray-800">{comments.length}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area - Comments + Related Memes */}
              <div className="flex-1 overflow-y-auto">
                {/* Comments Section */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  </h3>

                  {/* Comments List */}
                      <div className="space-y-4">
                        {isPostingComment && comments.length === 0 ? (
                         <div className="flex items-center justify-center py-8">
                           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading comments...</span>
                         </div>
                        ) : comments.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">
                           No comments yet. Be the first to comment!
                          </p>
                        ) : (
                          comments.map((comment) => (
                      <div key={comment.comment_id} className="space-y-2">
                        {/* Main Comment */}
                        <div className="flex gap-2">
                          {comment.user_profiles?.avatar_url ? (
                            <img 
                              src={comment.user_profiles.avatar_url} 
                              alt={comment.user_profiles.username} 
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-600">
                                {comment.user_profiles?.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">
                                {comment.user_profiles?.username || comment.user_profiles?.first_name || 'User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 break-words">{comment.content}</p>
                            <button
                              onClick={() => setReplyingTo(comment.comment_id)}
                              className="text-xs font-semibold text-gray-600 hover:text-gray-900 mt-1"
                            >
                              Reply
                            </button>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
                                {comment.replies.map((reply: any) => (
                                  <div key={reply.comment_id} className="flex gap-2">
                                    {reply.user_profiles?.avatar_url ? (
                                      <img 
                                        src={reply.user_profiles.avatar_url} 
                                        alt={reply.user_profiles.username} 
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold text-gray-600">
                                          {reply.user_profiles?.username?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-xs text-gray-900">
                                          {reply.user_profiles?.username || reply.user_profiles?.first_name || 'User'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(reply.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-800 break-words">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingTo === comment.comment_id && (
                              <div className="mt-3 pl-6">
                                <div className="flex gap-2">
                                  {getUserAvatar() ? (
                                    <img 
                                      src={getUserAvatar()!} 
                                      alt="You" 
                                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                      <User size={12} />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Add a reply..."
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          postComment(selectedMeme.meme_id, replyText, comment.comment_id);
                                        }
                                      }}
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => postComment(selectedMeme.meme_id, replyText, comment.comment_id)}
                                        disabled={!replyText.trim() || isPostingComment}
                                        className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                      >
                                        {isPostingComment ? 'Posting...' : 'Reply'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReplyingTo(null);
                                          setReplyText('');
                                        }}
                                        className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )))}

                    {comments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">
                        ----------------------------------------------
                      </p>
                    )}
                  </div>
                </div>

                {/* Related Memes Section */}
                <div className="p-6">
                  <div className="mb-4">
                    <span className="inline-block bg-gray-100 px-4 py-1.5 rounded-full text-sm font-semibold text-gray-700">
                      More like this
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {relatedMemes.map((meme, index) => (
                      <div 
                        key={`modal-related-${meme.meme_id}-${index}`}
                        className="cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                        onClick={() => setSelectedPost(meme.meme_id)}
                      >
                        <img
                          src={meme.image_url}
                          alt={meme.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2 bg-white">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{meme.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Comment Input - Fixed at bottom */}
              <div ref={commentInputRef} className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  {getUserAvatar() ? (
                    <img 
                      src={getUserAvatar()!} 
                      alt="You" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} />
                    </div>
                  )}
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          postComment(selectedMeme.meme_id, newComment);
                        }
                      }}
                    />
                    <button
                      onClick={() => postComment(selectedMeme.meme_id, newComment)}
                      disabled={!newComment.trim() || isPostingComment}
                      className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {isPostingComment && (
                       <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      )}
                      {isPostingComment ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showOptionsOverlay && (
            <div
              ref={optionsOverlayRef}
              className="absolute top-20 right-4 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 w-44"
            >
              <div 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => {
                  console.log('Download meme');
                  setShowOptionsOverlay(false);
                }}
              >
                Download meme
              </div>
              <div 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => {
                  console.log('Hide meme');
                  setShowOptionsOverlay(false);
                }}
              >
                Hide meme
              </div>
              <div 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
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
      </div>
    </div>
  </>
)}

         {/* Memes Grid */}
          {!selectedMeme && (
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

          {loading && memes.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading more memes...</p>
            </div>
          )}
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
            className="notification-panel fixed inset-0 bg-white z-50 overflow-y-auto transition-opacity duration-300 ease-in-out lg:hidden"
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold">Updates</h3>
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
              <h3 className="text-lg font-semibold">Updates</h3>
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

export default MemeVerse;