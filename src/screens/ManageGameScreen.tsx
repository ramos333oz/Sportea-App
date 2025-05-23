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
      
      // Fetch game data with host profile information
      const { data: gameData, error } = await supabase
        .from('games')
        .select(`
          *,
          participants:game_participants(*),
          host:profiles!games_host_id_fkey(*)
        `)
        .eq('id', gameId)
        .single();
      
      if (error) {
        console.error('Error fetching game details:', error);
        setLoading(false);
        return;
      }
      
      console.log('Game data received:', gameData);
      
      // If host profile isn't available through the join, fetch it separately
      if (!gameData.host && gameData.host_id) {
        console.log('Fetching host profile separately for host_id:', gameData.host_id);
        const { data: hostData, error: hostError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', gameData.host_id)
          .single();
          
        if (!hostError && hostData) {
          console.log('Host profile fetched:', hostData);
          gameData.host = hostData;
        } else {
          console.error('Error fetching host profile:', hostError);
        }
      }
      
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
              
              console.log('Starting deletion process for game:', gameId);
              
              // First try to delete participants one by one
              console.log('Step 1: Getting all participants');
              const { data: participants } = await supabase
                .from('game_participants')
                .select('id')
                .eq('game_id', gameId);
              
              if (participants && participants.length > 0) {
                console.log(`Step 2: Deleting ${participants.length} participants`);
                for (const participant of participants) {
                  await supabase
                    .from('game_participants')
                    .delete()
                    .eq('id', participant.id);
                }
              }
              
              // Clean up related tables
              console.log('Step 3: Cleaning up related tables');
              await supabase.from('matchmaking_queue').delete().eq('game_id', gameId);
              await supabase.from('matches').delete().eq('game_id', gameId);
              
              // Try to delete the game
              console.log('Step 4: Attempting to delete the game');
              const { error: deleteError } = await supabase
                .from('games')
                .delete()
                .eq('id', gameId);
              
              if (deleteError) {
                console.log('Physical deletion failed, using soft delete approach');
                
                // If physical deletion fails, mark as cancelled instead
                const { error: updateError } = await supabase
                  .from('games')
                  .update({ 
                    status: 'cancelled',
                    title: `[CANCELLED] ${game?.title || ''}`,
                    required_players: 0
                  })
                  .eq('id', gameId);
                
                if (updateError) {
                  console.error('Error marking game as cancelled:', updateError);
                  Alert.alert(
                    'Error',
                    'Failed to delete game. Please try again.',
                    [{ text: 'OK' }]
                  );
                  setDeleting(false);
                  return;
                }
              }
              
              console.log('Game successfully deleted/cancelled');
              Alert.alert(
                'Success', 
                'Game has been deleted',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    // Navigate back and refresh the dashboard to reflect the changes
                    navigation.goBack();
                  }
                }]
              );
            } catch (error: any) {
              console.error('Error in handleDeleteGame:', error);
              Alert.alert(
                'Error',
                `Failed to delete game: ${error?.message || 'An unexpected error occurred'}`,
                [{ text: 'OK' }]
              );
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
      <Card style={styles.header}>
        <Card.Content>
          <Text style={styles.title}>{game.title}</Text>
          <View style={styles.chipRow}>
            <Chip style={styles.chip} icon="basketball">{game.sport}</Chip>
            <Chip style={styles.chip} icon="account-group">{game.skill_level || 'All Levels'}</Chip>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.managementCard}>
        <Card.Content>
          <Text style={styles.title}>Game Management</Text>
          <Divider style={styles.divider} />
          
          <Text style={styles.managementText}>
            As the host of this game, you can view details, manage participants, and delete the game if needed.
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {game.participants?.filter(p => p.status === 'joined').length || 0}
              </Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{game.required_players}</Text>
              <Text style={styles.statLabel}>Required</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {game.date ? new Date(game.date).toLocaleDateString() : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Date</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.participantsCard}>
        <Card.Content>
          <Text style={styles.title}>Participants</Text>
          <Divider style={styles.divider} />
          
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
