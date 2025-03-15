import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button, Card, List, Divider, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

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

// Mock upcoming games
const upcomingGames = [
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

// Mock recent activity
const recentActivity = [
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
  const [activeTab, setActiveTab] = useState('games');
  
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
  
  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileImageContainer}>
        <Avatar.Image 
          source={{ uri: mockUser.profileImage }} 
          size={100} 
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editProfileImageButton}>
          <MaterialCommunityIcons name="camera" size={16} color={COLORS.background} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.name}>{mockUser.name}</Text>
        <Text style={styles.username}>{mockUser.username}</Text>
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.disabled} />
          <Text style={styles.location}>{mockUser.location}</Text>
        </View>
        
        <View style={styles.followContainer}>
          <View style={styles.followItem}>
            <Text style={styles.followCount}>{mockUser.followers}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
          <View style={styles.followItem}>
            <Text style={styles.followCount}>{mockUser.following}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderBio = () => (
    <View style={styles.bioContainer}>
      <Text style={styles.bioText}>{mockUser.bio}</Text>
    </View>
  );
  
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{mockUser.stats.gamesPlayed}</Text>
        <Text style={styles.statLabel}>Games Played</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{mockUser.stats.gamesHosted}</Text>
        <Text style={styles.statLabel}>Games Hosted</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{mockUser.stats.sportsPlayed.length}</Text>
        <Text style={styles.statLabel}>Sports</Text>
      </View>
    </View>
  );
  
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
            {mockUser.preferences.preferredSports.map(sport => (
              <View key={sport} style={styles.preferencesChip}>
                <Text style={styles.preferencesChipText}>{sport}</Text>
                <Text style={styles.skillLevelText}>
                  {mockUser.preferences.skillLevels[sport as keyof typeof mockUser.preferences.skillLevels]}
                </Text>
              </View>
            ))}
          </View>
          
          <Divider style={styles.preferenceDivider} />
          
          <Text style={styles.preferencesTitle}>Availability</Text>
          <Text style={styles.preferencesText}>{mockUser.preferences.availability}</Text>
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
        onPress={() => console.log('Settings')}
      />
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
});

export default ProfileScreen; 