import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Button, Card, Avatar, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { getAddressFromCoordinates } from '../utils/mapUtils';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import SporteaMap from '../components/MapView';
import { useAuth } from '../contexts/AuthContext';

type GameDetailsRouteProp = RouteProp<{ 
  GameDetails: { 
    gameId: string;
    isManaging?: boolean;
  } 
}, 'GameDetails'>;

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

interface Participant {
  id: string;
  user_id: string;
  status: string;
  game_id: string;
  created_at: string;
  profiles?: {
    username?: string;
    full_name?: string;
  };
}

interface GameDetailsScreenProps {
  route: GameDetailsRouteProp;
  navigation: any;
}

const GameDetailsScreen = ({ route, navigation }: GameDetailsScreenProps) => {
  const { gameId, isManaging } = route.params;
  
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchUserData();
    fetchGameDetails();
    fetchParticipants();
  }, [gameId]);
  
  // Effect to check if user is the host
  useEffect(() => {
    if (game && userId) {
      setIsHost(game.host_id === userId);
    }
  }, [game, userId]);

  useEffect(() => {
    // Create a channel for this specific game
    const channel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'games',
          filter: `id=eq.${gameId}` 
        }, 
        (payload) => {
          console.log('Game updated:', payload);
          if (payload.eventType === 'DELETE') {
            // Game was deleted, navigate back if we're still on this screen
            Alert.alert('Game Deleted', 'This game has been deleted by the host.');
            navigation.goBack();
            return;
          }
          
          // Update game data
          fetchGameDetails();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Participants updated:', payload);
          // Refresh participants list
          fetchParticipants();
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, navigation]);

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
      
      // Get location coordinates if available
      if (gameData.location?.latitude && gameData.location?.longitude) {
        try {
          const result = await getAddressFromCoordinates(
            gameData.location.latitude,
            gameData.location.longitude
          );
          setFormattedAddress(result.formattedAddress);
        } catch (error) {
          console.error('Error getting address:', error);
        }
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error in fetchGameDetails:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data: participantsData, error } = await supabase
        .from('game_participants')
        .select('*, profiles(*)')
        .eq('game_id', gameId);
      
      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }
      
      setParticipants(participantsData || []);
      
      // Check if user is a participant
      if (userId && participantsData) {
        const userParticipant = participantsData.find(
          (p: Participant) => p.user_id === userId && p.status === 'joined'
        );
        setIsParticipant(!!userParticipant);
      }
      
      // Check if user is the host
      if (game && userId) {
        const isUserHost = game.host_id === userId;
        setIsHost(isUserHost);
      }
    } catch (error) {
      console.error('Error in fetchParticipants:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGameDetails();
    await fetchParticipants();
    setRefreshing(false);
  };

  const handleJoinGame = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to join a game');
      return;
    }
    
    // Prevent joining if user is the host
    if (game?.host_id === userId) {
      Alert.alert('Info', 'You are the host of this game and already joined.');
      return;
    }
    
    // Check if user is hosting any active games
    try {
      setJoining(true);
      
      // Check if user is hosting any active games
      const { data: hostedGames, error: hostedGamesError } = await supabase
        .from('games')
        .select('id, title')
        .eq('host_id', userId)
        .eq('status', 'open');
        
      if (hostedGamesError) {
        console.error('Error checking hosted games:', hostedGamesError);
      } else if (hostedGames && hostedGames.length > 0) {
        Alert.alert(
          'Cannot Join Game', 
          'You are currently hosting a game. You need to delete your hosted game before joining another game.',
          [{ text: 'OK' }]
        );
        setJoining(false);
        return;
      }
      
      // Check if user is already a participant
      const { data: existingParticipant, error: participantCheckError } = await supabase
        .from('game_participants')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .single();
        
      if (participantCheckError && participantCheckError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('Error checking participant status:', participantCheckError);
      } else if (existingParticipant) {
        Alert.alert('Info', 'You have already joined this game.');
        setJoining(false);
        return;
      }
      
      // If all checks pass, join the game
      const { data, error } = await supabase
        .from('game_participants')
        .insert({ game_id: gameId, user_id: userId, status: 'joined' });
      
      if (error) {
        console.error('Error joining game:', error);
        Alert.alert('Error', 'Failed to join the game');
        setJoining(false);
        return;
      }
      
      // Refresh game details
      fetchGameDetails();
      fetchParticipants();
      Alert.alert('Success', 'You have joined the game!');
      setJoining(false);
    } catch (error) {
      console.error('Error in handleJoinGame:', error);
      setJoining(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!userId) {
      return;
    }
    
    try {
      setLeaving(true);
      const { data, error } = await supabase
        .from('game_participants')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error leaving game:', error);
        Alert.alert('Error', 'Failed to leave the game');
        setLeaving(false);
        return;
      }
      
      // Refresh game details
      fetchGameDetails();
      fetchParticipants();
      Alert.alert('Success', 'You have left the game');
      setLeaving(false);
    } catch (error) {
      console.error('Error in handleLeaveGame:', error);
      setLeaving(false);
    }
  };

  const getMapMarker = () => {
    if (!game || !game.location || !game.location.latitude || !game.location.longitude) {
      return [];
    }
    
    return [{
      id: game.id,
      latitude: game.location.latitude,
      longitude: game.location.longitude,
      title: game.title,
      description: formattedAddress || 'Game location'
    }];
  };

  const renderActionButton = () => {
    if (loading) {
      return <ActivityIndicator animating={true} color={COLORS.primary} />;
    }

    if (!game) {
      return (
        <Button mode="contained" disabled>
          Game Not Available
        </Button>
      );
    }

    // Calculate if the game is full
    const participantsCount = participants.filter(p => p.status === 'joined').length;
    const isFull = participantsCount >= game.required_players;

    // If user is the host, show manage button
    if (isHost) {
      return (
        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() => navigation.navigate('ManageGame', { gameId: game.id })}
        >
          Manage Game
        </Button>
      );
    }
    
    // If user is already a participant, show leave button
    if (isParticipant) {
      return (
        <Button
          mode="outlined"
          style={styles.actionButton}
          onPress={handleLeaveGame}
          loading={leaving}
          disabled={leaving}
        >
          Leave Game
        </Button>
      );
    }
    
    // Otherwise, show join button
    return (
      <Button
        mode="contained"
        style={styles.actionButton}
        onPress={handleJoinGame}
        loading={joining}
        disabled={joining || isFull}
      >
        {joining ? 'Joining...' : isFull ? 'Game Full' : 'Join Game'}
      </Button>
    );
  };

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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading game details...</Text>
        </View>
      ) : !game ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Game not found</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      ) : (
        <>
          {/* Game Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{game.title}</Text>
            
            <View style={styles.chipRow}>
              <Chip style={styles.chip} mode="outlined">{game.sport}</Chip>
              <Chip style={styles.chip} mode="outlined">{game.skill_level || 'All levels'}</Chip>
              <Chip 
                style={[styles.chip, { backgroundColor: participants.length >= game.required_players ? COLORS.error : COLORS.success }]} 
                textStyle={{ color: 'white' }}
              >
                {participants.length >= game.required_players ? 'Full' : `${game.required_players - participants.length} spots left`}
              </Chip>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Game Details */}
          <Card style={styles.detailsCard}>
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{new Date(game.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {(game.start_time && game.end_time) ? 
                    `${game.start_time.slice(0, 5)} - ${game.end_time.slice(0, 5)}` : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Host:</Text>
                <Text style={styles.detailValue}>
                  {game.host ? game.host.username || game.host.full_name || 'Unknown Host' : 'Unknown Host'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Players:</Text>
                <Text style={styles.detailValue}>{participants.length}/{game.required_players}</Text>
              </View>
              
              {game.fee && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fee:</Text>
                  <Text style={styles.detailValue}>{game.fee}</Text>
                </View>
              )}
              
              {game.equipment && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Equipment:</Text>
                  <Text style={styles.detailValue}>{game.equipment}</Text>
                </View>
              )}
              
              {game.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.description}>{game.description}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
          
          {/* Location */}
          <Card style={styles.mapCard}>
            <Card.Title title="Location" />
            <Card.Content>
              <Text style={styles.addressText}>{formattedAddress || 'Location information not available'}</Text>
              
              {game.location && game.location.latitude && game.location.longitude ? (
                <View style={styles.mapContainer}>
                  <SporteaMap
                    style={styles.map}
                    markers={getMapMarker()}
                    interactive={false}
                  />
                </View>
              ) : (
                <Text style={styles.noMapText}>Map not available</Text>
              )}
            </Card.Content>
          </Card>
          
          {/* Participants */}
          <Card style={styles.participantsCard}>
            <Card.Title 
              title="Participants" 
              subtitle={`${participants.length}/${game.required_players} players`} 
            />
            <Card.Content>
              <View style={styles.participantsList}>
                {participants && participants.length > 0 ? (
                  participants
                    .filter((p: Participant) => p.status === 'joined')
                    .map((participant: Participant, index: number) => (
                      <View key={participant.id} style={styles.participantItem}>
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
          
          {/* Join/Leave Button */}
          <View style={styles.actionButtonContainer}>
            {renderActionButton()}
          </View>
        </>
      )}
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
  detailsCard: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  detailValue: {
    flex: 2,
    color: COLORS.text,
  },
  descriptionContainer: {
    marginTop: SPACING.md,
  },
  descriptionLabel: {
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  description: {
    color: COLORS.text,
  },
  mapCard: {
    marginBottom: SPACING.md,
  },
  addressText: {
    marginBottom: SPACING.sm,
  },
  mapContainer: {
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  map: {
    height: '100%',
  },
  noMapText: {
    fontStyle: 'italic',
    color: COLORS.disabled,
    textAlign: 'center',
    padding: SPACING.md,
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
  },
  actionButton: {
    padding: SPACING.sm,
  },
  managementHeader: {
    marginBottom: SPACING.md,
  },
  managementTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  managementSubtitle: {
    color: COLORS.text,
  },
});

export default GameDetailsScreen;
