import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Button, Card, Avatar, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { gameUtils, authUtils } from '../utils/supabaseUtils';
import { getAddressFromCoordinates } from '../utils/mapUtils';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import SporteaMap from '../components/MapView';

type GameDetailsRouteProp = RouteProp<{ GameDetails: { gameId: string } }, 'GameDetails'>;

const GameDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<GameDetailsRouteProp>();
  const { gameId } = route.params;
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [isUserParticipant, setIsUserParticipant] = useState(false);
  const [isUserHost, setIsUserHost] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchGameDetails();
  }, [gameId]);

  const fetchUserData = async () => {
    try {
      const { user, error } = await authUtils.getUser();
      if (error || !user) {
        console.error('Error fetching user data:', error);
        return;
      }
      setUserId(user.id);
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const { game: gameData, error } = await gameUtils.getGameById(gameId);
      
      if (error) {
        console.error('Error fetching game details:', error);
        Alert.alert('Error', 'Failed to load game details');
        setLoading(false);
        return;
      }
      
      setGame(gameData);
      
      // Check if user is participant
      if (userId && gameData.participants) {
        const isParticipant = gameData.participants.some(
          p => p.user_id === userId && p.status === 'joined'
        );
        setIsUserParticipant(isParticipant);
        
        // Check if user is host
        setIsUserHost(userId === gameData.host_id);
      }
      
      // Get formatted address if location exists
      if (gameData.location && gameData.location.latitude && gameData.location.longitude) {
        const { formattedAddress: address } = await getAddressFromCoordinates(
          gameData.location.latitude,
          gameData.location.longitude
        );
        setFormattedAddress(address);
      }
      
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

  const handleJoinGame = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to join a game');
      return;
    }
    
    try {
      setJoining(true);
      const { data, error } = await gameUtils.joinGame(gameId, userId);
      
      if (error) {
        console.error('Error joining game:', error);
        Alert.alert('Error', 'Failed to join the game');
        setJoining(false);
        return;
      }
      
      // Refresh game details
      fetchGameDetails();
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
      const { data, error } = await gameUtils.leaveGame(gameId, userId);
      
      if (error) {
        console.error('Error leaving game:', error);
        Alert.alert('Error', 'Failed to leave the game');
        setLeaving(false);
        return;
      }
      
      // Refresh game details
      fetchGameDetails();
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
  
  // Get participants count
  const participantsCount = game.participants ? 
    game.participants.filter(p => p.status === 'joined').length : 0;
  
  const spotsLeft = game.required_players - participantsCount;
  const isFull = spotsLeft <= 0;

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
      
      {/* Game Details */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{timeRange}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Host:</Text>
            <Text style={styles.detailValue}>
              {game.host ? game.host.username || game.host.full_name || 'Unknown Host' : 'Unknown Host'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Players:</Text>
            <Text style={styles.detailValue}>{participantsCount}/{game.required_players}</Text>
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
          subtitle={`${participantsCount}/${game.required_players} players`} 
        />
        <Card.Content>
          <View style={styles.participantsList}>
            {game.participants && game.participants.length > 0 ? (
              game.participants
                .filter(p => p.status === 'joined')
                .map((participant, index) => (
                  <View key={participant.user_id} style={styles.participantItem}>
                    <Avatar.Text 
                      size={40} 
                      label={participant.profiles?.username?.charAt(0) || 'U'} 
                      backgroundColor={COLORS.primary}
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
        {isUserHost ? (
          <Button
            mode="contained"
            style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
            onPress={() => navigation.navigate('CreateGame', { gameId })}
          >
            Edit Game
          </Button>
        ) : isUserParticipant ? (
          <Button
            mode="contained"
            style={[styles.actionButton, { backgroundColor: COLORS.error }]}
            onPress={handleLeaveGame}
            loading={leaving}
            disabled={leaving}
          >
            Leave Game
          </Button>
        ) : (
          <Button
            mode="contained"
            style={styles.actionButton}
            onPress={handleJoinGame}
            loading={joining}
            disabled={joining || isFull}
          >
            {isFull ? 'Game is Full' : 'Join Game'}
          </Button>
        )}
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
});

export default GameDetailsScreen;
