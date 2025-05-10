import React, { useState, useEffect } from 'react';

import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Text, Avatar, Button, Card, FAB, Snackbar, Modal, Portal, Surface } from 'react-native-paper';
=======
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Avatar, Button, Card, List, Divider, FAB, Snackbar, Modal, Portal } from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

import { getUserProfile, getUserStats, getUserGames, updateUserProfile } from '../utils/profileUtils';

// Import our new components
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import ProfileBioEdit from '../components/ProfileBioEdit';
import SportPreferences from '../components/SportPreferences';
import Achievements from '../components/Achievements';
import UsernameEdit from '../components/UsernameEdit';
=======
import { getUserProfile, getUserStats, getUserGames } from '../utils/profileUtils';
import { supabase } from '../services/supabase';
import { TABLES } from '../constants/database';


interface Sport {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface UserStats {
  gamesPlayed: number;
  gamesHosted: number;
  sportsPlayed: Sport[];
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
  sports_preferences?: Sport[];
  stats?: UserStats;
}

// Keep mock data as fallback
const mockUser = {
  id: '1',
  name: 'John Smith',
  username: '@johnsmith',
  bio: 'Sports enthusiast. Love basketball, football and volleyball. Looking for friendly matches around campus.',
  profileImage: 'https://via.placeholder.com/150',
  location: 'University Campus',
  followers: 124,
  following: 86,
  stats: {
    gamesPlayed: 27,
    gamesHosted: 8,
    sportsPlayed: [
      { name: 'Basketball', count: 15 },
      { name: 'Football', count: 8 },
      { name: 'Volleyball', count: 4 }
    ]
  },
  preferences: {
    preferredSports: ['Basketball', 'Football', 'Volleyball'],
    skillLevels: {
      'Basketball': 'Advanced',
      'Football': 'Intermediate',
      'Volleyball': 'Beginner'
    },
    availability: 'Weekends and evenings'
  }
};

// Mock upcoming games and activity as fallback
const mockUpcomingGames = [
  {
    id: '1',
    title: 'Basketball 3v3',
    date: '2023-06-15T16:30:00',
    location: 'Main Basketball Court',
    participants: 5,
    totalSpots: 6,
    isHost: true
  },
  {
    id: '2',
    title: 'Football Friendly',
    date: '2023-06-17T14:00:00',
    location: 'University Field',
    participants: 16,
    totalSpots: 22,
    isHost: false
  }
];

const mockRecentActivity = [
  {
    id: '1',
    type: 'joined',
    gameTitle: 'Football Friendly',
    timestamp: '2023-06-10T14:30:00'
  },
  {
    id: '2',
    type: 'hosted',
    gameTitle: 'Basketball 3v3',
    timestamp: '2023-06-08T18:00:00'
  },
  {
    id: '3',
    type: 'completed',
    gameTitle: 'Volleyball Match',
    timestamp: '2023-06-05T17:00:00'
  }
];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
=======
  const [activeTab, setActiveTab] = useState('games');

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);


=======
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Fallback to mock data if no user
      setProfile(mockUser);
      setUpcomingGames(mockUpcomingGames);
      setRecentActivity(mockRecentActivity);
      setIsLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!refreshing) setIsLoading(true);
    setError('');

    try {
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      console.log('Loading data for user:', user.id);

      // Get user profile
      const { data: profileData, error: profileError } = await getUserProfile(user.id);

      if (profileError) {
        console.error('Profile error:', profileError);
        // Don't throw here, continue to load other data
      }

      if (profileData) {
        console.log('Profile loaded successfully');
        setProfile(profileData);
      } else {
        console.warn('No profile data returned');
        // Create a default profile if none exists
        setProfile({
          id: user.id,
          username: user.email ? user.email.split('@')[0] : 'user',
          avatar_url: undefined,
          bio: '',
          sports_preferences: [],
          full_name: '',
          // Add any other required fields from UserProfile type
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);
      }

      // Get user stats
      const { data: statsData, error: statsError } = await getUserStats(user.id);

      if (statsError) {
        console.error('Stats error:', statsError);
        // Don't throw here, continue to load other data
      }

      if (statsData) {
        console.log('Stats loaded successfully');
        setStats(statsData);
      } else {
        console.warn('No stats data returned');
        // Set default stats
        setStats({
          gamesPlayed: 0,
          gamesHosted: 0,
          sportsPlayed: [],
          upcomingGames: 0
        });
      }

      // Get user games
      const { data: gamesData, error: gamesError } = await getUserGames(user.id);

      if (gamesError) {
        console.error('Games error:', gamesError);
        // Don't throw here, continue processing
      }


      if (gamesData && gamesData.all && Array.isArray(gamesData.all)) {
        console.log('Games loaded successfully');
        // Filter for upcoming games
        const today = new Date();
        today.setHours(0, 0, 0, 0);

=======
      
      if (gamesData) {

        const upcoming = gamesData.all
          .filter((game: any) => new Date(game.date) >= new Date())
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

          .slice(0, 5); // Get only the nearest 5 games

        setUpcomingGames(upcoming);

        // Create activity from games
        const activity = [
          // Games hosted by user
          ...(gamesData.hosted || []).map((game: any) => ({
=======
          .slice(0, 5);
        
        setUpcomingGames(upcoming);
        
        const activity = [
          ...gamesData.hosted.map((game: any) => ({

            id: `hosted-${game.id}`,
            type: 'hosted',
            gameTitle: game.title,
            timestamp: game.created_at,
            gameId: game.id
          })),


          // Games joined by user
          ...(gamesData.joined || []).map((game: any) => ({
=======
          ...gamesData.joined.map((game: any) => ({

            id: `joined-${game.id}`,
            type: 'joined',
            gameTitle: game.title,
            timestamp: game.created_at,
            gameId: game.id
          }))

        ]
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Get most recent 10 activities

=======
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        

        setRecentActivity(activity);
      } else {
        console.warn('No games data returned or invalid format');
        setUpcomingGames([]);
        setRecentActivity([]);
      }
    } catch (error) {
      setError(error.message);
      setSnackbarMessage('Error loading profile data');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };


  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  // Handle profile updates
  const handleProfileUpdate = (field: string, value: any) => {
    if (!profile || !user) return;

    // Update local state immediately for better UX
    setProfile(prev => prev ? { ...prev, [field]: value } : null);

    // Update profile in database
    updateUserProfile(user.id, { [field]: value })
      .catch(err => {
        console.error(`Error updating ${field}:`, err);
        setError(`Failed to update ${field}. Please try again.`);
        // Revert to previous value on error
        loadUserData();
      });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Display relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
  };

  const renderProfileHeader = () => {
    if (!profile) return null;

    const displayName = profile.full_name || profile.username || 'User';
    const displayUsername = profile.username ? `@${profile.username}` : '';

    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Avatar.Image
            source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username || user?.id?.substring(0, 8) || 'User'}&background=random&color=fff&size=100` }}
            size={100}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.editProfileImageButton}
            onPress={() => {
              setActiveTab('profile');
              // Create a small delay to ensure the tab has changed before showing the image picker
              setTimeout(() => {
                // Find the ProfilePictureUpload component and trigger its pickImage method
                if (profile && user) {
                  // For web platforms
                  if (Platform.OS === 'web' && typeof document !== 'undefined') {
                    const event = new CustomEvent('pickProfileImage');
                    document.dispatchEvent(event);
                  }
                  // For non-web platforms
                  else if (typeof global !== 'undefined' && (global as any).pickProfileImage) {
                    (global as any).pickProfileImage();
                  }
                }
              }, 100);
            }}
          >
            <MaterialCommunityIcons name="camera" size={16} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>{displayUsername}</Text>
          {profile.location && (
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.disabled} />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          )}

          <View style={styles.followContainer}>
            <View style={styles.followItem}>
              <Text style={styles.followCount}>{profile.followers_count || 0}</Text>
              <Text style={styles.followLabel}>Followers</Text>
=======
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigation.navigate('Login');
    } catch (error) {
      setSnackbarMessage('Error logging out: ' + error.message);
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
      setShowSettings(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Avatar.Image
            size={80}
            source={{ uri: profile?.avatar_url || mockUser.profileImage }}
          />
          <Text style={styles.name}>{profile?.full_name || mockUser.name}</Text>
          <Text style={styles.username}>{profile?.username || mockUser.username}</Text>
          <Text style={styles.location}>{profile?.location || mockUser.location}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats?.gamesPlayed || mockUser.stats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile?.followers_count || mockUser.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>

            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile?.following_count || mockUser.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

      </View>
    );
  };

  // Removed unused renderBio function

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.gamesHosted}</Text>
          <Text style={styles.statLabel}>Games Hosted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.sportsPlayed?.length || 0}</Text>
          <Text style={styles.statLabel}>Sports</Text>
        </View>
      </View>
    );
  };

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
        onPress={() => setActiveTab('profile')}
      >
        <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'games' && styles.activeTab]}
        onPress={() => setActiveTab('games')}
      >
        <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>Games</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
        onPress={() => setActiveTab('activity')}
      >
        <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
        onPress={() => setActiveTab('achievements')}
      >
        <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUpcomingGames = () => (
    <View style={styles.contentContainer}>
      {upcomingGames.length > 0 ? (
        upcomingGames.map(game => (
          <Card key={game.id} style={styles.gameCard}>
            <Card.Content>
              <View style={styles.gameCardHeader}>
                <View>
                  <Text style={styles.gameTitle}>{game.title}</Text>
                  <Text style={styles.gameInfo}>{formatDate(game.date)}</Text>
                  <Text style={styles.gameInfo}>{game.location}</Text>
                </View>
                {game.isHost && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>Host</Text>
                  </View>
                )}
              </View>
              <View style={styles.gameFooter}>
                <Text style={styles.playersText}>
                  {game.participants}/{game.totalSpots} players
                </Text>
                <Button
                  mode="text"
                  compact
                  onPress={() => console.log('View game details')}
                >
                  View Details
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-blank" size={40} color={COLORS.disabled} />
          <Text style={styles.emptyStateText}>No upcoming games</Text>
          <Button
            mode="contained"
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('FindGames' as never)}
          >
            Find Games
          </Button>
        </View>
      )}
    </View>
  );

  const renderActivity = () => (
    <View style={styles.contentContainer}>
      {recentActivity.length > 0 ? (
        recentActivity.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIconContainer}>
              {activity.type === 'joined' && (
                <MaterialCommunityIcons name="account-plus" size={24} color={COLORS.success} />
              )}
              {activity.type === 'hosted' && (
                <MaterialCommunityIcons name="trophy" size={24} color={COLORS.warning} />
              )}
              {activity.type === 'completed' && (
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.info} />
              )}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                {activity.type === 'joined' && 'You joined '}
                {activity.type === 'hosted' && 'You hosted '}
                {activity.type === 'completed' && 'You completed '}
                <Text style={styles.activityGameTitle}>{activity.gameTitle}</Text>
=======

        <View style={styles.content}>
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'games' && styles.activeTab]}
              onPress={() => setActiveTab('games')}
            >
              <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>
                Games

              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
                Activity
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'games' ? (
            <View style={styles.gamesContainer}>
              {upcomingGames.map((game) => (
                <Card key={game.id} style={styles.gameCard}>
                  <Card.Content>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <Text style={styles.gameInfo}>{game.location}</Text>
                    <Text style={styles.gameInfo}>
                      {new Date(game.date).toLocaleDateString()} at{' '}
                      {new Date(game.date).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.gameParticipants}>
                      {game.participants}/{game.totalSpots} participants
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.activityContainer}>
              {recentActivity.map((activity) => (
                <List.Item
                  key={activity.id}
                  title={activity.gameTitle}
                  description={`${activity.type} • ${new Date(
                    activity.timestamp
                  ).toLocaleDateString()}`}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        activity.type === 'hosted'
                          ? 'star'
                          : activity.type === 'joined'
                          ? 'account-plus'
                          : 'check-circle'
                      }
                    />
                  )}
                />
              ))}
            </View>
          )}
        </View>

      )}
    </View>
  );

  const renderProfileContent = () => {
    if (!profile || !user) return null;

    // Log profile data for debugging
    console.log('Profile data:', JSON.stringify(profile, null, 2));

    return (
      <View style={styles.contentContainer}>
        {/* Profile Picture Upload - Hidden but accessible for the camera button */}
        <View style={{ height: 0, overflow: 'hidden' }}>
          <ProfilePictureUpload
            userId={user.id}
            avatarUrl={profile.avatar_url}
            onUploadComplete={(url: string) => handleProfileUpdate('avatar_url', url)}
          />
        </View>

        {/* Username Edit */}
        <UsernameEdit
          userId={user.id}
          initialUsername={profile.username || ''}
          onSave={(newUsername: string) => handleProfileUpdate('username', newUsername)}
        />

        {/* User ID Display */}
        <Surface style={styles.userIdContainer}>
          <Text style={styles.userIdLabel}>User ID:</Text>
          <Text style={styles.userId}>{user.id}</Text>
        </Surface>

        {/* Bio Section */}
        <ProfileBioEdit
          userId={user.id}
          initialBio={profile.bio || ''}
          onSave={(newBio: string) => handleProfileUpdate('bio', newBio)}
        />

        {/* Sport Preferences */}
        <SportPreferences
          userId={user.id}
          initialPreferences={(profile.sports_preferences as any) || []}
          onUpdate={(prefs: any) => handleProfileUpdate('sports_preferences', prefs)}
        />
      </View>
    );
  };

  const renderAchievements = () => {
    if (!stats) return null;

    return (
      <View style={styles.contentContainer}>
        <Achievements stats={stats} />
      </View>
    );
  };

  const handleLogout = async () => {
    try {
      const { success, error } = await signOut();
      if (!success) {
        throw new Error(error || 'Failed to sign out');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const renderSettingsModal = () => (
    <Portal>
      <Modal
        visible={showSettings}
        onDismiss={() => setShowSettings(false)}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowSettings(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {renderProfileHeader()}
        {renderStats()}
        {renderTabSelector()}

        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'games' && renderUpcomingGames()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'achievements' && renderAchievements()}
=======

      </ScrollView>

      <FAB
        style={styles.fab}
        icon="cog"

        color={COLORS.background}
        onPress={() => setShowSettings(true)}
      />

      {renderSettingsModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        action={{
          label: 'Dismiss',
          onPress: () => setError(''),
        }}
=======
        onPress={() => setShowSettings(true)}
      />

      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Settings</Text>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            loading={isLoading}
          >
            Logout
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowSettings(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}

      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  name: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginTop: SPACING.small,
  },
  username: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  location: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.tiny,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SPACING.medium,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: SPACING.medium,
  },
  tabSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.medium,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.small,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  gamesContainer: {
    gap: SPACING.small,
  },
  gameCard: {
    marginBottom: SPACING.small,
    borderRadius: BORDER_RADIUS.medium,
  },
  gameTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
  },
  gameInfo: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.tiny,
  },
  gameParticipants: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
    marginTop: SPACING.tiny,
  },
  activityContainer: {
    gap: SPACING.tiny,
  },
  fab: {
    position: 'absolute',
    right: SPACING.medium,
    bottom: SPACING.medium,
    backgroundColor: COLORS.primary,
  },
  modal: {
    backgroundColor: COLORS.background,
    padding: SPACING.large,
    margin: SPACING.large,
    borderRadius: BORDER_RADIUS.large,
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginBottom: SPACING.medium,
  },
  logoutButton: {
    marginBottom: SPACING.small,
  },
  cancelButton: {
    borderColor: COLORS.border,
  },
  modalContainer: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    margin: SPACING.xl,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  logoutButton: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.error,
  },
  cancelButton: {
    borderColor: COLORS.border,
  },
  // New styles for enhanced profile
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    elevation: 1,
  },
  userIdLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  userId: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
    flex: 1,
  },
});

export default ProfileScreen;