import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Text, Avatar, Button, Card, FAB, Snackbar, Modal, Portal, Surface } from 'react-native-paper';
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
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);

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

        const upcoming = gamesData.all
          .filter((game: any) => new Date(game.date) >= today)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5); // Get only the nearest 5 games

        setUpcomingGames(upcoming);

        // Create activity from games
        const activity = [
          // Games hosted by user
          ...(gamesData.hosted || []).map((game: any) => ({
            id: `hosted-${game.id}`,
            type: 'hosted',
            gameTitle: game.title,
            timestamp: game.created_at,
            gameId: game.id
          })),

          // Games joined by user
          ...(gamesData.joined || []).map((game: any) => ({
            id: `joined-${game.id}`,
            type: 'joined',
            gameTitle: game.title,
            timestamp: game.created_at,
            gameId: game.id
          }))
        ]
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Get most recent 10 activities

        setRecentActivity(activity);
      } else {
        console.warn('No games data returned or invalid format');
        setUpcomingGames([]);
        setRecentActivity([]);
      }
    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError(err.message || 'Failed to load user data');
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
            </View>
            <View style={styles.followItem}>
              <Text style={styles.followCount}>{profile.following_count || 0}</Text>
              <Text style={styles.followLabel}>Following</Text>
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
              </Text>
              <Text style={styles.activityTime}>{getRelativeTime(activity.timestamp)}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="history" size={40} color={COLORS.disabled} />
          <Text style={styles.emptyStateText}>No recent activity</Text>
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
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    backgroundColor: COLORS.background,
  },
  editProfileImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileInfo: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  username: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    opacity: 0.8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.8,
    marginLeft: 2,
  },
  followContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  followItem: {
    marginRight: SPACING.lg,
  },
  followCount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  followLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.8,
  },
  bioContainer: {
    padding: SPACING.lg,
  },
  bioText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  gameCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gameTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gameInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginTop: 2,
  },
  hostBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
  },
  hostBadgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  playersText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.disabled,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  activityGameTitle: {
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginTop: 2,
  },
  preferencesCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  preferencesTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  preferencesChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preferencesChip: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  preferencesChipText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  skillLevelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  preferenceDivider: {
    marginVertical: SPACING.md,
  },
  preferencesText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  editPreferencesButton: {
    marginTop: SPACING.md,
    borderColor: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.disabled,
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