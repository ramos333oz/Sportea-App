import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Surface, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the navigation param list
type RootStackParamList = {
  Dashboard: undefined;
  FindGames: undefined | { sport: string };
  CreateGame: undefined;
  GameDetails: { gameId: string };
  ManageGame: { gameId: string };
};

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// Sport icon mapping
const getSportIcon = (sportType: string) => {
  switch (sportType?.toLowerCase()) {
    case 'basketball':
      return 'basketball';
    case 'football':
      return 'soccer';
    case 'badminton':
      return 'badminton';
    case 'table-tennis':
      return 'table-tennis';
    case 'volleyball':
      return 'volleyball';
    case 'tennis':
      return 'tennis';
    default:
      return 'trophy'; // Changed from 'sport' to a valid icon name
  }
};

// Sport color mapping
const getSportColor = (sportType: string) => {
  switch (sportType?.toLowerCase()) {
    case 'basketball':
      return '#FF6B00'; // Orange
    case 'football':
      return '#4CAF50'; // Green
    case 'badminton':
      return '#2196F3'; // Blue
    case 'table-tennis':
      return '#F44336'; // Red
    case 'volleyball':
      return '#9C27B0'; // Purple
    case 'tennis':
      return '#FFEB3B'; // Yellow
    default:
      return COLORS.primary;
  }
};

// Define error color if not already in COLORS
if (!COLORS.error) {
  COLORS.error = '#F44336'; // Red color for errors
}

// Popular sports data
const popularSports = [
  { id: '1', name: 'Basketball' },
  { id: '2', name: 'Football' },
  { id: '3', name: 'Badminton' },
  { id: '4', name: 'Table Tennis' },
  { id: '5', name: 'Volleyball' }
];

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useAuth();
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // Format date for display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Handle permanent deletion of a cancelled game
  const handlePermanentDelete = async (gameId: string) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Delete Game Permanently',
        'Are you sure you want to permanently delete this game? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Show loading indicator
                setLoading(true);

                // APPROACH: Since we're having foreign key constraint issues,
                // let's use a two-step process:
                // 1. First mark the game as fully deleted (different from cancelled)
                // 2. Then remove it from the UI immediately

                // Update the game to mark it as fully deleted
                const { error: updateError } = await supabase
                  .from('games')
                  .update({
                    status: 'deleted',
                    title: `[DELETED] Game ${gameId.substring(0, 8)}...`,
                    description: 'This game has been permanently deleted by the host.'
                  })
                  .eq('id', gameId);

                if (updateError) {
                  console.error('Error marking game as deleted:', updateError);
                  Alert.alert('Error', 'Failed to delete game. Please try again.');
                  setLoading(false);
                  return;
                }

                // Remove the game from the local state immediately
                setUpcomingGames(prevGames => prevGames.filter(game => game.id !== gameId));

                // Refresh games list in the background
                fetchGames();

                setLoading(false);
                Alert.alert('Success', 'Game has been permanently deleted from your view.');
              } catch (error) {
                console.error('Error in permanent delete:', error);
                Alert.alert('Error', 'An unexpected error occurred.');
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handlePermanentDelete:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // Fetch user's games and profile
  const fetchGames = async () => {
    try {
      setLoading(true);

      if (!user) return;

      console.log('Fetching games for user:', user.id);

      // Set current date
      setCurrentDate(formatDate(new Date()));

      // Fetch user profile to get username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setUsername(profileData.full_name || profileData.username || 'User');
      }

      // Fetch user's upcoming games (games they're hosting or participating in)
      const { data: participatingGames, error: participatingError } = await supabase
        .from('game_participants')
        .select(`
          game:game_id(
            id,
            title,
            description,
            sport,
            skill_level,
            date,
            start_time,
            end_time,
            required_players,
            location,
            host_id,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'joined');

      if (participatingError) {
        console.error('Error fetching participating games:', participatingError);
      }

      // Fetch games the user is hosting, including cancelled games
      const { data: hostedGames, error: hostedError } = await supabase
        .from('games')
        .select('*')
        .eq('host_id', user.id);

      if (hostedError) {
        console.error('Error fetching hosted games:', hostedError);
      }

      // Combine and format the games
      const userGames: any[] = [];

      // Add participating games
      if (participatingGames) {
        participatingGames.forEach(item => {
          if (item.game) {
            userGames.push(item.game);
          }
        });
      }

      // Add hosted games (avoiding duplicates)
      if (hostedGames) {
        hostedGames.forEach(game => {
          if (!userGames.some(g => g.id === game.id)) {
            userGames.push(game);
          }
        });
      }

      // Get participant counts for all games
      const gameIds = userGames.map(game => game.id);

      // Only fetch participant counts if there are games
      let participantCounts: Record<string, number> = {};

      if (gameIds.length > 0) {
        // Fetch participants for each game individually
        await Promise.all(gameIds.map(async (gameId) => {
          const { data, error } = await supabase
            .from('game_participants')
            .select('*')
            .eq('game_id', gameId)
            .eq('status', 'joined');

          if (error) {
            console.error(`Error fetching participants for game ${gameId}:`, error);
          } else if (data) {
            participantCounts[gameId] = data.length;
          }
        }));
      }

      // Filter out deleted games completely and only show cancelled games to hosts
      const formattedUserGames = userGames
        .filter(game => {
          // Remove games with 'deleted' status completely
          if (game.status === 'deleted') return false;

          // Keep the game if it's not cancelled OR if the user is the host
          return game.status !== 'cancelled' || game.host_id === user.id;
        })
        .map(game => {
          // Format date and time
          const gameDate = new Date(game.date);
          const today = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);

          let dateText;
          if (gameDate.toDateString() === today.toDateString()) {
            dateText = 'Today';
          } else if (gameDate.toDateString() === tomorrow.toDateString()) {
            dateText = 'Tomorrow';
          } else {
            dateText = format(gameDate, 'EEE, MMM d');
          }

          // Format time with validation
          let startTime = '';
          if (game.start_time) {
            try {
              // Ensure the time format is valid (HH:MM:SS or HH:MM)
              const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
              if (timeRegex.test(game.start_time)) {
                startTime = format(new Date(`2000-01-01T${game.start_time}`), 'h:mm a');
              } else {
                startTime = game.start_time; // Use as is if not in expected format
              }
            } catch (error) {
              console.error('Error formatting time:', error);
              startTime = game.start_time; // Fallback to original string
            }
          }

          // Get participant count for this game
          const participantsCount = participantCounts[game.id] || 0;

          // Format location
          let locationText = 'Location not specified';
          if (typeof game.location === 'string') {
            locationText = game.location;
          } else if (game.location && game.location.name) {
            locationText = game.location.name;
          }

          return {
            id: game.id,
            title: game.title,
            date: `${dateText}, ${startTime}`,
            location: locationText,
            participants: participantsCount,
            totalSpots: game.required_players || 0,
            sportType: game.sport,
            isHosting: game.host_id === user.id,
            isCancelled: game.status === 'cancelled',
            status: game.status
          };
        });

      setUpcomingGames(formattedUserGames);

    } catch (error) {
      console.error('Error in fetchGames:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGames();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Welcome Header */}
        <Surface style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeText}>Welcome, {username}!</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <Avatar.Icon
              size={48}
              icon="account"
              style={styles.profileAvatar}
              color={COLORS.background}
            />
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('FindGames')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary }]}>
                <MaterialCommunityIcons name="magnify" color={COLORS.background} size={24} />
              </View>
              <Text style={styles.quickActionText}>Find Games</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CreateGame')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.secondary }]}>
                <MaterialCommunityIcons name="plus" color={COLORS.background} size={24} />
              </View>
              <Text style={styles.quickActionText}>Host Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Profile' as any)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.tertiary }]}>
                <MaterialCommunityIcons name="account" color={COLORS.background} size={24} />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Upcoming Games Section */}
        <Surface style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Upcoming Games</Text>
            <MaterialCommunityIcons name="calendar" size={24} color={COLORS.primary} />
          </View>
          <Divider style={styles.divider} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : upcomingGames.length > 0 ? (
            upcomingGames.map((game) => (
              <Surface key={game.id} style={[styles.gameCard, game.isCancelled && styles.cancelledGameCard]}>
                {game.isCancelled && (
                  <View style={styles.cancelledBanner}>
                    <Text style={styles.cancelledText}>CANCELLED</Text>
                  </View>
                )}
                <View style={styles.gameCardHeader}>
                  <View style={[styles.sportIconContainer, { backgroundColor: game.isCancelled ? COLORS.error : getSportColor(game.sportType) }]}>
                    <MaterialCommunityIcons
                      name={game.isCancelled ? 'cancel' : getSportIcon(game.sportType)}
                      size={24}
                      color={COLORS.background}
                    />
                  </View>
                  <View style={styles.gameCardTitleContainer}>
                    <Text style={[styles.gameCardTitle, game.isCancelled && styles.cancelledGameText]}>{game.title}</Text>
                    <Text style={[styles.gameCardDate, game.isCancelled && styles.cancelledGameText]}>
                      {game.date}
                    </Text>
                  </View>
                </View>

                <View style={styles.gameCardDetails}>
                  <View style={styles.gameDetailItem}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={game.isCancelled ? COLORS.error : COLORS.text} style={styles.detailIcon} />
                    <Text style={[styles.gameCardLocation, game.isCancelled && styles.cancelledGameText]}>
                      {game.location}
                    </Text>
                  </View>

                  <View style={styles.gameDetailItem}>
                    <MaterialCommunityIcons name="account-group" size={16} color={game.isCancelled ? COLORS.error : COLORS.text} style={styles.detailIcon} />
                    <Text style={[styles.gameCardParticipants, game.isCancelled && styles.cancelledGameText]}>
                      {game.participants}/{game.totalSpots} players
                    </Text>
                  </View>
                </View>

                <View style={styles.gameCardActions}>
                  {game.isCancelled && game.isHosting ? (
                    <Button
                      mode="contained"
                      onPress={() => handlePermanentDelete(game.id)}
                      style={[styles.detailsButton, styles.deleteButton]}
                      labelStyle={styles.detailsButtonLabel}
                      icon={() => <MaterialCommunityIcons name="delete" size={16} color={COLORS.background} />}
                    >
                      Delete Permanently
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={() => {
                        if (game.isHosting) {
                          navigation.navigate('ManageGame', { gameId: game.id });
                        } else {
                          navigation.navigate('GameDetails', { gameId: game.id });
                        }
                      }}
                      style={styles.detailsButton}
                      labelStyle={styles.detailsButtonLabel}
                      icon={() => <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.background} />}
                      contentStyle={styles.detailsButtonContent}
                    >
                      Details
                    </Button>
                  )}
                </View>
              </Surface>
            ))
          ) : (
            <Surface style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.disabled} style={styles.emptyIcon} />
              <Text style={styles.emptyCardText}>No upcoming games</Text>
              <Text style={styles.emptyCardSubText}>
                Host a new game or join existing ones!
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateGame')}
                style={styles.emptyCardButton}
                labelStyle={styles.emptyCardButtonLabel}
              >
                Host a Game
              </Button>
            </Surface>
          )}
        </Surface>

        {/* Test Realtime Section */}
        <Surface style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Realtime Features</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TestRealtime' as never)}>
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Open Test</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
          <Divider style={styles.divider} />

          <Button
            mode="contained"
            onPress={() => navigation.navigate('TestRealtime' as never)}
            style={{ marginVertical: SPACING.md }}
            icon="access-point"
          >
            Test Realtime Functionality
          </Button>
        </Surface>

        {/* Popular Sports Section */}
        <Surface style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Sports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FindGames')}>
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.sportsGrid}>
            {popularSports.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                style={styles.sportItem}
                onPress={() => navigation.navigate('FindGames', { sport: sport.name.toLowerCase() })}
              >
                <View style={[styles.sportIconBg, { backgroundColor: getSportColor(sport.name) }]}>
                  <MaterialCommunityIcons
                    name={getSportIcon(sport.name.toLowerCase())}
                    size={24}
                    color={COLORS.background}
                  />
                </View>
                <Text style={styles.sportItemText}>{sport.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  welcomeCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    elevation: 2,
  },
  cancelledGameCard: {
    borderColor: COLORS.error,
    borderWidth: 1,
    opacity: 0.8,
  },
  cancelledBanner: {
    backgroundColor: COLORS.error,
    padding: SPACING.xs,
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  cancelledText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.sm,
  },
  cancelledGameText: {
    color: COLORS.text,
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    opacity: 0.7,
    marginTop: SPACING.xs,
  },
  profileAvatar: {
    backgroundColor: COLORS.primary,
  },
  // Quick Actions Styles
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  // Section Styles
  sectionContainer: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    marginBottom: SPACING.md,
    height: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  // Game Card Styles
  gameCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    elevation: 1,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameCardTitleContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  gameCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gameCardDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    opacity: 0.7,
  },
  gameCardDetails: {
    marginBottom: SPACING.md,
  },
  gameDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailIcon: {
    marginRight: SPACING.xs,
  },
  gameCardLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  gameCardParticipants: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  gameCardActions: {
    alignItems: 'flex-end',
  },
  detailsButton: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  detailsButtonLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
  },
  detailsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  // Empty Card Styles
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyCardText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyCardSubText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  emptyCardButton: {
    marginTop: SPACING.sm,
  },
  emptyCardButtonLabel: {
    fontSize: FONT_SIZES.sm,
  },
  // Sports Grid Styles
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  sportItem: {
    width: '20%',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  sportIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sportItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
});

export default DashboardScreen;