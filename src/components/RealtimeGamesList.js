import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import realtimeService from '../services/realtimeService';

const RealtimeGamesList = ({ navigation, userId }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load games on component mount
  useEffect(() => {
    loadGames();

    // Initialize realtime service
    realtimeService.initialize();

    // Subscribe to game changes
    const unsubscribe = realtimeService.onGameChange((payload) => {
      console.log('Game change detected:', payload);
      
      // Reload games when changes are detected
      loadGames();
    });

    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Load games from the database
  const loadGames = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      // Get games from the database
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          host:host_id(id, username, avatar_url),
          game_participants(id, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process the games data
      const processedGames = data.map(game => {
        // Calculate the number of participants
        const participantCount = game.game_participants ? game.game_participants.length : 0;
        
        // Check if the current user is a participant
        const isParticipant = game.game_participants 
          ? game.game_participants.some(p => p.user_id === userId)
          : false;
        
        // Check if the current user is the host
        const isHost = game.host_id === userId;
        
        // Format the date
        const gameDate = new Date(game.date);
        const formattedDate = gameDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        
        return {
          ...game,
          participantCount,
          isParticipant,
          isHost,
          formattedDate
        };
      });

      setGames(processedGames);
    } catch (err) {
      console.error('Error loading games:', err);
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  // Render a game card
  const renderGameCard = ({ item }) => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{item.title}</Text>
              {item.isHost && (
                <Chip 
                  style={styles.hostChip}
                  textStyle={styles.hostChipText}
                >
                  Host
                </Chip>
              )}
              {item.isParticipant && !item.isHost && (
                <Chip 
                  style={styles.participantChip}
                  textStyle={styles.participantChipText}
                >
                  Joined
                </Chip>
              )}
            </View>
            <Text style={styles.sport}>{item.sport}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar" size={16} color={COLORS.disabled} />
              <Text style={styles.infoText}>{item.formattedDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.disabled} />
              <Text style={styles.infoText}>{item.time}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.disabled} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
          </View>
          
          <View style={styles.participantsContainer}>
            <Text style={styles.participantsText}>
              {item.participantCount}/{item.max_players} players
            </Text>
            <Button 
              mode="contained" 
              compact
              onPress={() => navigation.navigate('GameDetails', { gameId: item.id })}
            >
              View Details
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="basketball" size={64} color={COLORS.disabled} />
        <Text style={styles.emptyText}>No games found</Text>
        <Button 
          mode="contained"
          onPress={loadGames}
          style={styles.retryButton}
        >
          Refresh
        </Button>
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (!error) return null;
    
    return (
      <Surface style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained"
          onPress={loadGames}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {error ? renderErrorState() : (
        <FlatList
          data={games}
          renderItem={renderGameCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
      
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
  sport: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  hostChip: {
    backgroundColor: COLORS.primary + '20',
    height: 24,
    marginLeft: SPACING.xs,
  },
  hostChipText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
  },
  participantChip: {
    backgroundColor: COLORS.success + '20',
    height: 24,
    marginLeft: SPACING.xs,
  },
  participantChipText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.xs,
  },
  infoContainer: {
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginLeft: SPACING.xs,
  },
  participantsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.disabled,
    marginVertical: SPACING.md,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    marginVertical: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.sm,
  },
});

export default RealtimeGamesList;
