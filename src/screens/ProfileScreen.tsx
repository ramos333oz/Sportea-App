import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Avatar, Button, Card, List, Divider, FAB, Snackbar, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
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
  const [activeTab, setActiveTab] = useState('games');
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
    setError('');
    
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await getUserProfile(user.id);
      
      if (profileError) {
        throw profileError;
      }
      
      if (profileData) {
        setProfile(profileData);
      }
      
      // Get user stats
      const { data: statsData, error: statsError } = await getUserStats(user.id);
      
      if (statsError) {
        throw statsError;
      }
      
      if (statsData) {
        setStats(statsData);
      }
      
      // Get user games
      const { data: gamesData, error: gamesError } = await getUserGames(user.id);
      
      if (gamesError) {
        throw gamesError;
      }
      
      if (gamesData) {
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
          ...gamesData.hosted.map((game: any) => ({
            id: `hosted-${game.id}`,
            type: 'hosted',
            gameTitle: game.title,
            timestamp: game.created_at,
            gameId: game.id
          })),
          
          // Games joined by user
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
        
        setRecentActivity(activity);
      }
    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
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
            source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }} 
            size={100} 
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editProfileImageButton}>
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
  
  const renderBio = () => {
    if (!profile) return null;
    
    return (
      <View style={styles.bioContainer}>
        <Text style={styles.bioText}>{profile.bio || 'No bio yet'}</Text>
      </View>
    );
  };
  
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
        style={[styles.tab, activeTab === 'games' && styles.activeTab]}
        onPress={() => setActiveTab('games')}
      >
        <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>Upcoming Games</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
        onPress={() => setActiveTab('activity')}
      >
        <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'preferences' && styles.activeTab]}
        onPress={() => setActiveTab('preferences')}
      >
        <Text style={[styles.tabText, activeTab === 'preferences' && styles.activeTabText]}>Preferences</Text>
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
  
  const renderPreferences = () => (
    <View style={styles.contentContainer}>
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <Text style={styles.preferencesTitle}>Preferred Sports</Text>
          <View style={styles.preferencesChipsContainer}>
            {profile.sports_preferences?.map(sport => (
              <View key={sport.id} style={styles.preferencesChip}>
                <Text style={styles.preferencesChipText}>{sport.name}</Text>
                <Text style={styles.skillLevelText}>
                  {profile.stats?.sportsPlayed.find(s => s.name === sport.name)?.count || 0}
                </Text>
              </View>
            ))}
          </View>
          
          <Divider style={styles.preferenceDivider} />
          
          <Text style={styles.preferencesTitle}>Availability</Text>
          <Text style={styles.preferencesText}>{profile.preferences?.availability}</Text>
        </Card.Content>
      </Card>
      
      <Button 
        mode="outlined" 
        style={styles.editPreferencesButton}
        onPress={() => console.log('Edit preferences')}
      >
        Edit Preferences
      </Button>
    </View>
  );
  
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderProfileHeader()}
        {renderBio()}
        {renderStats()}
        {renderTabSelector()}
        
        {activeTab === 'games' && renderUpcomingGames()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'preferences' && renderPreferences()}
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
});

export default ProfileScreen; 