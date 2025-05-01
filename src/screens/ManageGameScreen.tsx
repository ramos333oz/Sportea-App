import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Button, Card, Avatar, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../config/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

// Game type definition
interface GameParticipant {
  user_id: string;
  status: string;
  profiles?: {
    username?: string;
    full_name?: string;
  };
}

interface GameLocation {
  id?: string;
  name?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
}

interface Game {
  id: string;
  title: string;
  description?: string;
  sport: string;
  skill_level?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  required_players: number;
  host_id: string;
  location?: GameLocation;
  participants?: GameParticipant[];
  host?: {
    username?: string;
    full_name?: string;
  };
  fee?: string;
  equipment?: string;
}

// Define the navigation param list
type RootStackParamList = {
  Dashboard: undefined;
  GameDetails: { gameId: string };
  ManageGame: { gameId: string };
};

type ManageGameScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type ManageGameRouteProp = RouteProp<RootStackParamList, 'ManageGame'>;

const ManageGameScreen = () => {
  const navigation = useNavigation<ManageGameScreenNavigationProp>();
  const route = useRoute<ManageGameRouteProp>();
  const { gameId } = route.params;
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchUserData();
    fetchGameDetails();
  }, [gameId]);

  const fetchUserData = async () => {
    try {
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching game details for ID:', gameId);
      
      // Fetch game data
      const { data: gameData, error } = await supabase
        .from('games')
        .select(`
          *,
          participants:game_participants(*)
        `)
        .eq('id', gameId)
        .single();
      
      if (error) {
        console.error('Error fetching game details:', error);
        setLoading(false);
        return;
      }
      
      console.log('Game data received:', gameData);
      
      // Set game data
      setGame(gameData);
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error in fetchGameDetails:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGameDetails();
  };

  const handleDeleteGame = () => {
    Alert.alert(
      'Delete Game',
      'Are you sure you want to delete this game? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const { error } = await supabase
                .from('games')
                .delete()
                .eq('id', gameId);
              
              if (error) {
                console.error('Error deleting game:', error);
                Alert.alert('Error', 'Failed to delete the game');
                setDeleting(false);
                return;
              }
              
              Alert.alert('Success', 'Game has been deleted');
              navigation.goBack();
            } catch (error) {
              console.error('Error in handleDeleteGame:', error);
              Alert.alert('Error', 'An unexpected error occurred');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading game details...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Game not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  // Format date
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Format time
  const startTime = game.start_time ? game.start_time.slice(0, 5) : '';
  const endTime = game.end_time ? game.end_time.slice(0, 5) : '';
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
  
  // Calculate participants count and spots left
  const participantsCount = game?.participants?.length || 0;
  const spotsLeft = game?.required_players ? game.required_players - participantsCount : 0;
  const isFull = spotsLeft <= 0;
  const isUserHost = game?.host_id === userId;

  // Ensure only the host can manage the game
  if (!isUserHost) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>You do not have permission to manage this game</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Game Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{game.title}</Text>
        
        <View style={styles.chipRow}>
          <Chip style={styles.chip} mode="outlined">{game.sport}</Chip>
          <Chip style={styles.chip} mode="outlined">{game.skill_level || 'All levels'}</Chip>
          <Chip 
            style={[styles.chip, { backgroundColor: isFull ? COLORS.error : COLORS.success }]} 
            textStyle={{ color: 'white' }}
          >
            {isFull ? 'Full' : `${spotsLeft} spots left`}
          </Chip>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      {/* Game Management */}
      <Card style={styles.managementCard}>
        <Card.Title title="Game Management" />
        <Card.Content>
          <Text style={styles.managementText}>
            As the host of this game, you have the ability to manage it. You can view participants and delete the game if needed.
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{participantsCount}/{game.required_players}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedDate}</Text>
              <Text style={styles.statLabel}>Date</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{timeRange || 'Not specified'}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Participants */}
      <Card style={styles.participantsCard}>
        <Card.Title 
          title="Participants" 
          subtitle={`${participantsCount}/${game.required_players} players`} 
        />
        <Card.Content>
          <View style={styles.participantsList}>
            {game.participants && game.participants.length > 0 ? (
              game.participants
                .filter((p: GameParticipant) => p.status === 'joined')
                .map((participant: GameParticipant, index: number) => (
                  <View key={participant.user_id} style={styles.participantItem}>
                    <Avatar.Text 
                      size={40} 
                      label={participant.profiles?.username?.charAt(0) || 'U'} 
                      style={{ backgroundColor: COLORS.primary }}
                    />
                    <Text style={styles.participantName}>
                      {participant.profiles?.username || participant.profiles?.full_name || 'Unknown Player'}
                    </Text>
                    {participant.user_id === game.host_id && (
                      <Chip compact style={styles.hostChip}>Host</Chip>
                    )}
                  </View>
                ))
            ) : (
              <Text style={styles.noParticipantsText}>No participants yet</Text>
            )}
          </View>
        </Card.Content>
      </Card>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonContainer}>
        <Button
          mode="contained"
          style={[styles.actionButton, styles.viewDetailsButton]}
          onPress={() => {
            if (game) {
              navigation.navigate('GameDetails', { gameId: game.id });
            }
          }}
        >
          View Details
        </Button>
        
        <Button
          mode="contained"
          style={[styles.actionButton, styles.deleteButton]}
          buttonColor={COLORS.error}
          onPress={handleDeleteGame}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete Game'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  divider: {
    marginBottom: SPACING.md,
  },
  managementCard: {
    marginBottom: SPACING.md,
  },
  managementText: {
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  participantsCard: {
    marginBottom: SPACING.md,
  },
  participantsList: {
    marginTop: SPACING.xs,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantName: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  hostChip: {
    backgroundColor: COLORS.secondary,
    marginLeft: SPACING.sm,
  },
  noParticipantsText: {
    fontStyle: 'italic',
    color: COLORS.disabled,
    textAlign: 'center',
    padding: SPACING.md,
  },
  actionButtonContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
});

export default ManageGameScreen;
