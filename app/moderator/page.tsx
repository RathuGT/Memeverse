'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { User, AlertTriangle, Trash2, Eye, EyeOff, CheckCircle, XCircle, Shield, TrendingUp } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Report {
  report_id: string;
  reporter_id: string;
  meme_id?: string;
  comment_id?: string;
  reported_user_id?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  meme?: any;
  comment?: any;
  reporter?: any;
}

interface Stats {
  totalMemes: number;
  totalUsers: number;
  totalComments: number;
  pendingReports: number;
  totalReports: number;
}

export default function ModeratorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'memes' | 'comments' | 'users' | 'reports'>('dashboard');
  
  const [stats, setStats] = useState<Stats>({
    totalMemes: 0,
    totalUsers: 0,
    totalComments: 0,
    pendingReports: 0,
    totalReports: 0
  });
  
  const [memes, setMemes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'hidden'>('all');

  // Check authentication and moderator role
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          alert('Please log in to access the moderator dashboard');
          router.push('/login');
          return;
        }

        setUser(session.user);

        // Get user profile and check role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!profile || (profile.user_type !== 'moderator' && profile.user_type !== 'admin')) {
          alert('Access denied. You do not have moderator privileges.');
          router.push('/');
          return;
        }

        setUserProfile(profile);
        fetchStats();
        fetchAllData();
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

    // Fetch dashboard stats
    const fetchStats = async () => {
    try {
        const [memesCount, usersCount, commentsCount] = await Promise.all([
        supabase.from('meme').select('meme_id', { count: 'exact', head: true }),
        supabase.from('user_profiles_with_email').select('user_id', { count: 'exact', head: true }),  // Changed
        supabase.from('comment').select('comment_id', { count: 'exact', head: true })
        ]);

        setStats({
         totalMemes: memesCount.count || 0,
         totalUsers: usersCount.count || 0,
         totalComments: commentsCount.count || 0,
         pendingReports: 0,
         totalReports: 0
        });
     } catch (error) {
     console.error('Error fetching stats:', error);
     }
    };

    // Fetch all data
    const fetchAllData = async () => {
    try {
        const [memesData, commentsData, usersData] = await Promise.all([
        supabase
            .from('meme')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
        supabase
            .from('comment')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
         supabase
            .from('user_profiles_with_email')  // Changed from 'user_profiles'
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
     ]);

        setMemes(memesData.data || []);
        setComments(commentsData.data || []);
        setUsers(usersData.data || []);
     } catch (error) {
        console.error('Error fetching data:', error);
    }
    };

  // Delete meme
  const deleteMeme = async (memeId: string) => {
    if (!confirm('Are you sure you want to delete this meme? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('meme')
        .delete()
        .eq('meme_id', memeId);

      if (error) throw error;

      alert('Meme deleted successfully');
      fetchAllData();
      fetchStats();
    } catch (error) {
      console.error('Error deleting meme:', error);
      alert('Failed to delete meme');
    }
  };

  // Toggle meme visibility
  const toggleMemeVisibility = async (memeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('meme')
        .update({ is_published: !currentStatus })
        .eq('meme_id', memeId);

      if (error) throw error;

      alert(`Meme ${currentStatus ? 'hidden' : 'published'} successfully`);
      fetchAllData();
    } catch (error) {
      console.error('Error toggling meme visibility:', error);
      alert('Failed to update meme visibility');
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comment')
        .delete()
        .eq('comment_id', commentId);

      if (error) throw error;

      alert('Comment deleted successfully');
      fetchAllData();
      fetchStats();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  // Ban/unban user
  const toggleUserBan = async (userId: string, currentStatus: string) => {
  const newStatus = currentStatus === 'banned' ? 'registered' : 'banned';
  
  if (!confirm(`Are you sure you want to ${currentStatus === 'banned' ? 'unban' : 'ban'} this user?`)) {
    return;
  }

  try {
    const { error } = await supabase
      .from('user_profiles')  // Still use user_profiles for updates
      .update({ user_type: newStatus })
      .eq('user_id', userId);

    if (error) throw error;

    alert(`User ${currentStatus === 'banned' ? 'unbanned' : 'banned'} successfully`);
    fetchAllData();
  } catch (error) {
    console.error('Error updating user status:', error);
    alert('Failed to update user status');
  }
};

const promoteToModerator = async (userId: string) => {
  if (!confirm('Are you sure you want to promote this user to moderator?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('user_profiles')  // Still use user_profiles for updates
      .update({ user_type: 'moderator' })
      .eq('user_id', userId);

    if (error) throw error;

    alert('User promoted to moderator successfully');
    fetchAllData();
  } catch (error) {
    console.error('Error promoting user:', error);
    alert('Failed to promote user');
  }
};

  const filteredMemes = memes.filter(meme => {
    const matchesSearch = meme.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'published' && meme.is_published) ||
      (filterStatus === 'hidden' && !meme.is_published);
    return matchesSearch && matchesFilter;
  });

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Moderator Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {userProfile?.username || 'Moderator'}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {(['dashboard', 'memes', 'comments', 'users'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Platform Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Memes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMemes}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  </div>
                  <User className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Comments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComments}</p>
                  </div>
                  <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Reports</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingReports}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Memes</h3>
              <div className="space-y-3">
                {memes.slice(0, 5).map((meme) => (
                  <div key={meme.meme_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <img
                        src={meme.image_url}
                        alt={meme.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{meme.title}</p>
                        <p className="text-xs text-gray-500">{new Date(meme.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meme.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {meme.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Memes Tab */}
        {activeTab === 'memes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Manage Memes</h2>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
                </select>
                <input
                  type="text"
                  placeholder="Search memes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meme</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMemes.map((meme) => (
                      <tr key={meme.meme_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <img
                            src={meme.image_url}
                            alt={meme.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{meme.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(meme.created_at).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <p>😊 {meme.smiles_count}</p>
                            <p>💬 {meme.comments_count}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            meme.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {meme.is_published ? 'Published' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleMemeVisibility(meme.meme_id, meme.is_published)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={meme.is_published ? 'Hide' : 'Publish'}
                            >
                              {meme.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button
                              onClick={() => deleteMeme(meme.meme_id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Manage Comments</h2>
              <input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredComments.map((comment) => (
                  <div key={comment.comment_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Posted on {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteComment(comment.comment_id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((userItem) => (
                      <tr key={userItem.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {userItem.avatar_url ? (
                              <img
                                src={userItem.avatar_url}
                                alt={userItem.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={20} className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{userItem.username || 'No username'}</p>
                              <p className="text-xs text-gray-500">{userItem.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <p>Memes: {userItem.total_memes_created || 0}</p>
                            <p>Smiles: {userItem.total_smiles_received || 0}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            userItem.user_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                            userItem.user_type === 'moderator' ? 'bg-blue-100 text-blue-700' :
                            userItem.user_type === 'banned' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {userItem.user_type || 'registered'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {userItem.user_type !== 'admin' && userItem.user_type !== 'moderator' && (
                              <button
                                onClick={() => promoteToModerator(userItem.user_id)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Make Moderator
                              </button>
                            )}
                            {userItem.user_type !== 'admin' && (
                              <button
                                onClick={() => toggleUserBan(userItem.user_id, userItem.user_type)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                  userItem.user_type === 'banned'
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                    : 'text-red-600 bg-red-50 hover:bg-red-100'
                                }`}
                              >
                                {userItem.user_type === 'banned' ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}