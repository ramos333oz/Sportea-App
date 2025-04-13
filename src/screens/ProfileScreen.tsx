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
        const upcoming = gamesData.all
          .filter((game: any) => new Date(game.date) >= new Date())
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
          ...gamesData.joined.map((game: any) => ({
            id: `joined-${game.id}`,
            type: 'joined',
            gameTitle: game.title,
            timestamp: game.created_at,
            gameId: game.id
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setRecentActivity(activity);
      }
    } catch (error) {
      setError(error.message);
      setSnackbarMessage('Error loading profile data');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

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
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="cog"
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
});

export default ProfileScreen;