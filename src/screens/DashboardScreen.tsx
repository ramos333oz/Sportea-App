import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

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
  switch (sportType) {
    case 'basketball':
      return 'basketball';
    case 'football':
      return 'soccer';
    case 'badminton':
      return 'badminton';
    case 'table-tennis':
      return 'table-tennis';
    default:
      return 'sport';
  }
};

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

  // Fetch user's games
  const fetchGames = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      console.log('Fetching games for user:', user.id);
      
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
            host_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'joined');
        
      if (participatingError) {
        console.error('Error fetching participating games:', participatingError);
      }
      
      // Fetch games the user is hosting
      const { data: hostedGames, error: hostedError } = await supabase
        .from('games')
        .select('*')
        .eq('host_id', user.id)
        .in('status', ['open', 'full', 'in-progress']);
        
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
      
      // Format the games for display
      const formattedUserGames = userGames.map(game => {
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
        
        // Format time
        const startTime = game.start_time ? format(new Date(`2000-01-01T${game.start_time}`), 'h:mm a') : '';
        
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
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button 
            mode="contained" 
            icon="plus" 
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            onPress={() => navigation.navigate('CreateGame')}
          >
            Host a Game
          </Button>
          
          <Button 
            mode="outlined" 
            icon="magnify" 
            style={[styles.actionButton, styles.secondaryButton]}
            contentStyle={styles.actionButtonContent}
            onPress={() => navigation.navigate('FindGames')}
          >
            Find Games
          </Button>
        </View>
        
        {/* Upcoming Games Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Upcoming Games</Text>
            <Text 
              style={styles.viewAllText}
              onPress={() => navigation.navigate('FindGames')}
            >
              View All
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : upcomingGames.length > 0 ? (
            upcomingGames.map((game) => (
              <Card key={game.id} style={styles.gameCard}>
                <Card.Content>
                  <View style={styles.gameCardHeader}>
                    <Avatar.Icon 
                      size={48} 
                      icon={getSportIcon(game.sportType)} 
                      style={styles.sportIcon} 
                    />
                    <View style={styles.gameCardTitleContainer}>
                      <Text style={styles.gameCardTitle}>{game.title}</Text>
                      <Text style={styles.gameCardDate}>{game.date}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.gameCardLocation}>{game.location}</Text>
                  <Text style={styles.gameCardParticipants}>
                    {game.participants}/{game.totalSpots} participants
                  </Text>
                </Card.Content>
                
                <Card.Actions style={styles.gameCardActions}>
                  <Button 
                    mode="outlined" 
                    style={styles.gameCardButton}
                    onPress={() => navigation.navigate('GameDetails', { gameId: game.id })}
                  >
                    Details
                  </Button>
                  
                  {game.isHosting && (
                    <Button 
                      mode="contained" 
                      style={styles.gameCardButton}
                      onPress={() => {
                        // @ts-ignore - Navigation type issue workaround
                        navigation.navigate('GameDetails', { 
                          gameId: game.id,
                          isManaging: true 
                        });
                      }}
                    >
                      Manage
                    </Button>
                  )}
                </Card.Actions>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyCardText}>
                  You don't have any upcoming games.
                </Text>
                <Text style={styles.emptyCardSubText}>
                  Host a game or join one to get started!
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
        
        {/* Popular Sports Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Sports</Text>
            <Text 
              style={styles.viewAllText}
              onPress={() => navigation.navigate('FindGames')}
            >
              View All
            </Text>
          </View>
          
          <View style={styles.sportsGrid}>
            {popularSports.map((sport) => (
              <TouchableOpacity 
                key={sport.id}
                style={styles.sportItem}
                onPress={() => navigation.navigate('FindGames', { sport: sport.name.toLowerCase() })}
              >
                <Avatar.Icon 
                  size={48} 
                  icon={getSportIcon(sport.name.toLowerCase())} 
                  style={styles.sportItemIcon} 
                />
                <Text style={styles.sportItemText}>{sport.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  header: {
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
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  actionButtonContent: {
    height: 48,
    justifyContent: 'center',
  },
  secondaryButton: {
    marginLeft: SPACING.sm,
    borderColor: COLORS.primary,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
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
  viewAllText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    opacity: 0.7,
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  gameCard: {
    marginBottom: SPACING.sm,
    borderRadius: 10,
    elevation: 2,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sportIcon: {
    backgroundColor: COLORS.primary,
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
  gameCardLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  gameCardParticipants: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    opacity: 0.7,
  },
  gameCardActions: {
    justifyContent: 'space-between',
  },
  gameCardButton: {
    flex: 1,
    margin: 4,
  },
  emptyCard: {
    marginBottom: SPACING.sm,
    borderRadius: 10,
    elevation: 1,
    alignItems: 'center',
    padding: SPACING.md,
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
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportItem: {
    width: '20%',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  sportItemIcon: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  sportItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default DashboardScreen;