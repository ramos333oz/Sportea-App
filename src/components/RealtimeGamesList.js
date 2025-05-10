import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, Avatar, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import realtimeService from '../services/realtimeService';

const RealtimeGamesList = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize realtime service and fetch games
  useEffect(() => {
    const initializeAndFetch = async () => {
      setLoading(true);

      // Initialize realtime service
      realtimeService.initialize();

      // Register callback for game updates
      realtimeService.onGameUpdate(handleGameUpdate);

      // Fetch initial games
      await fetchGames();

      setLoading(false);
    };

    initializeAndFetch();

    // Cleanup on unmount
    return () => {
      realtimeService.offGameUpdate(handleGameUpdate);
    };
  }, []);

  // Handle game updates from realtime service
  const handleGameUpdate = (gameData) => {
    if (!gameData) return;

    console.log('Received game update in component:', gameData);

    // Handle different event types
    switch (gameData.eventType) {
      case 'INSERT':
        // Add new game to the list
        setGames(prevGames => {
          // Check if game already exists
          const exists = prevGames.some(game => game.id === gameData.id);
          if (exists) return prevGames;

          // Add new game and sort by start time
          const updatedGames = [...prevGames, gameData]
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

          return updatedGames;
        });
        break;

      case 'UPDATE':
        // Update existing game
        setGames(prevGames => {
          return prevGames.map(game =>
            game.id === gameData.id ? { ...game, ...gameData } : game
          );
        });
        break;

      case 'DELETE':
        // Remove deleted game
        setGames(prevGames => prevGames.filter(game => game.id !== gameData.id));
        break;

      default:
        console.log('Unknown event type:', gameData.eventType);
    }
  };

  // Fetch games from the server
  const fetchGames = async () => {
    try {
      const { success, games: fetchedGames, error } = await realtimeService.fetchActiveGames();

      if (success && fetchedGames) {
        setGames(fetchedGames);
      } else if (error) {
        console.error('Error fetching games:', error);
      }
    } catch (error) {
      console.error('Error in fetchGames:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  // Navigate to game details
  const navigateToGameDetails = (gameId) => {
    navigation.navigate('GameDetails', { gameId });
  };

  // Render a game card
  const renderGameCard = ({ item }) => {
    const game = item;
    const startTime = new Date(game.start_time);
    const formattedDate = startTime.toLocaleDateString();
    const formattedTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate spots left
    const participantsCount = game.participants?.length || 0;
    const spotsLeft = game.required_players - participantsCount;

    // Check if user is a participant or host
    const isUserParticipant = game.participants?.some(p => p.user_id === user?.id);
    const isUserHost = game.host_id === user?.id;

    return (
      <Card style={styles.card} onPress={() => navigateToGameDetails(game.id)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>{game.title}</Title>
            <Chip mode="outlined" style={styles.sportChip}>{game.sport}</Chip>
          </View>

          <View style={styles.hostInfo}>
            <Avatar.Image
              size={24}
              source={{ uri: game.host?.avatar_url || 'https://ui-avatars.com/api/?name=' + (game.host?.username || 'User') }}
            />
            <Text style={styles.hostName}>Hosted by {game.host?.username || 'Unknown'}</Text>
          </View>

          <Paragraph style={styles.cardDescription}>{game.description}</Paragraph>

          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>📅 {formattedDate}</Text>
            <Text style={styles.detailText}>⏰ {formattedTime}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>📍 {game.location_name || 'Location TBD'}</Text>
            <Text style={styles.detailText}>👥 {participantsCount}/{game.required_players} players</Text>
          </View>
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => navigateToGameDetails(game.id)}
            disabled={spotsLeft <= 0 && !isUserParticipant && !isUserHost}
          >
            {isUserParticipant ? 'View Details' : isUserHost ? 'Manage Game' : spotsLeft <= 0 ? 'Full' : 'Join Game'}
          </Button>

          {(isUserParticipant || isUserHost) && (
            <Chip mode="outlined" style={{ backgroundColor: COLORS.success, marginLeft: SPACING.sm }}>
              {isUserHost ? 'Hosting' : 'Joined'}
            </Chip>
          )}
        </Card.Actions>
      </Card>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  // Show empty state
  if (games.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No games available</Text>
        <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        <FlatList
          data={[]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      </View>
    );
  }

  // Render games list
  return (
    <FlatList
      data={games}
      renderItem={renderGameCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  sportChip: {
    backgroundColor: COLORS.accent + '20',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  hostName: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    color: COLORS.text,
  },
  cardDescription: {
    marginBottom: SPACING.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
  },
  cardActions: {
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.disabled,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
});

export default RealtimeGamesList;
