import { supabase } from '../config/supabase';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Define table names directly in the service to avoid dependency issues
const TABLES = {
  PROFILES: 'profiles',
  GAMES: 'games',
  GAME_PARTICIPANTS: 'game_participants',
  MATCHMAKING_QUEUE: 'matchmaking_queue',
  MATCHES: 'matches'
};

// Matchmaking service to handle player matching
class MatchmakingService {
  constructor() {
    this.channels = {
      matches: null,
      queue: null,
      games: null
    };
    this.userId = null;
    this.userProfile = null;
    this.userLocation = null;
    this.matchCallbacks = [];
    this.gameCallbacks = [];
    this.queueCallbacks = [];
    this.isInitialized = false;
  }

  // Initialize the matchmaking service with user data
  async initialize(userId) {
    this.userId = userId;

    try {
      // Get user profile
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      this.userProfile = data;

      // Get user location
      await this.updateUserLocation();

      // Set initialized flag
      this.isInitialized = true;

      console.log('Matchmaking service initialized for user:', userId);
      return true;
    } catch (error) {
      console.error('Error initializing matchmaking service:', error);
      return false;
    }
  }

  // Update user's current location
  async updateUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return false;
      }

      const location = await Location.getCurrentPositionAsync({});
      this.userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Update user's location in the database
      if (this.userId) {
        await supabase
          .from(TABLES.PROFILES)
          .update({
            last_location: {
              latitude: this.userLocation.latitude,
              longitude: this.userLocation.longitude,
              updated_at: new Date().toISOString(),
            }
          })
          .eq('id', this.userId);
      }

      return true;
    } catch (error) {
      console.error('Error updating user location:', error);
      return false;
    }
  }

  // Start looking for matches
  async startMatchmaking(preferences = {}) {
    if (!this.isInitialized) {
      console.error('Matchmaking service not initialized');
      return false;
    }

    try {
      // Update matchmaking status
      const { error } = await supabase
        .from(TABLES.MATCHMAKING_QUEUE)
        .upsert({
          user_id: this.userId,
          preferences: {
            sports: preferences.sports || this.userProfile.preferred_sports || [],
            skill_level: preferences.skillLevel || 'all',
            max_distance: preferences.maxDistance || 10, // km
            looking_for_game: preferences.lookingForGame || true,
          },
          location: this.userLocation,
          status: 'searching',
          last_updated: new Date().toISOString(),
          device_info: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Subscribe to matchmaking events
      this.subscribeToRealTimeEvents();

      console.log('Started matchmaking with preferences:', preferences);
      return true;
    } catch (error) {
      console.error('Error starting matchmaking:', error);
      return false;
    }
  }

  // Stop looking for matches
  async stopMatchmaking() {
    try {
      // Update matchmaking status
      if (this.userId) {
        await supabase
          .from(TABLES.MATCHMAKING_QUEUE)
          .update({ status: 'inactive' })
          .eq('user_id', this.userId);
      }

      // Unsubscribe from matchmaking events
      this.unsubscribeFromRealTimeEvents();

      console.log('Stopped matchmaking');
      return true;
    } catch (error) {
      console.error('Error stopping matchmaking:', error);
      return false;
    }
  }

  // Subscribe to all real-time events
  subscribeToRealTimeEvents() {
    this.subscribeToMatches();
    this.subscribeToQueue();
    this.subscribeToGames();
  }

  // Unsubscribe from all real-time events
  unsubscribeFromRealTimeEvents() {
    this.unsubscribeFromMatches();
    this.unsubscribeFromQueue();
    this.unsubscribeFromGames();
  }

  // Subscribe to matches table for this user
  subscribeToMatches() {
    if (this.channels.matches) {
      this.unsubscribeFromMatches();
    }

    try {
      this.channels.matches = supabase
        .channel('matches-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.MATCHES,
          filter: `user_id=eq.${this.userId}`,
        }, (payload) => {
          console.log('Received match update:', payload);
          this.handleMatchUpdate(payload.new);
        })
        .subscribe((status) => {
          console.log(`Matches channel status: ${status}`);
        });

      console.log('Subscribed to matches events');
    } catch (error) {
      console.error('Error subscribing to matches:', error);
    }
  }

  // Subscribe to matchmaking queue updates
  subscribeToQueue() {
    if (this.channels.queue) {
      this.unsubscribeFromQueue();
    }

    try {
      this.channels.queue = supabase
        .channel('queue-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.MATCHMAKING_QUEUE,
          filter: `user_id=eq.${this.userId}`,
        }, (payload) => {
          console.log('Received queue update:', payload);
          this.notifyCallbacks(this.queueCallbacks, payload.new);
        })
        .subscribe((status) => {
          console.log(`Queue channel status: ${status}`);
        });

      console.log('Subscribed to queue events');
    } catch (error) {
      console.error('Error subscribing to queue:', error);
    }
  }

  // Subscribe to games updates
  subscribeToGames() {
    if (this.channels.games) {
      this.unsubscribeFromGames();
    }

    try {
      // Subscribe to all game events (INSERT, UPDATE, DELETE)
      this.channels.games = supabase
        .channel('games-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.GAMES,
        }, (payload) => {
          console.log('New game created:', payload);
          // Notify callbacks with the new game data
          this.notifyCallbacks(this.gameCallbacks, {
            ...payload.new,
            eventType: 'INSERT'
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.GAMES,
        }, (payload) => {
          console.log('Game updated:', payload);
          // Notify callbacks with the updated game data
          this.notifyCallbacks(this.gameCallbacks, {
            ...payload.new,
            eventType: 'UPDATE'
          });
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: TABLES.GAMES,
        }, (payload) => {
          console.log('Game deleted:', payload);
          // Notify callbacks with the deleted game data (old data)
          this.notifyCallbacks(this.gameCallbacks, {
            ...payload.old,
            eventType: 'DELETE'
          });
        })
        .subscribe((status) => {
          console.log(`Games channel status: ${status}`);
        });

      // Also subscribe to game participants
      supabase
        .channel('game-participants-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.GAME_PARTICIPANTS,
          filter: `user_id=eq.${this.userId}`,
        }, (payload) => {
          console.log('Received game participant update:', payload);
          this.fetchGameDetails(payload.new?.game_id || payload.old?.game_id);
        })
        .subscribe();

      console.log('Subscribed to games events');
    } catch (error) {
      console.error('Error subscribing to games:', error);
    }
  }

  // Fetch game details when participant status changes
  async fetchGameDetails(gameId) {
    if (!gameId) return;

    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select(`
          *,
          participants:${TABLES.GAME_PARTICIPANTS}(*)
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;

      this.notifyCallbacks(this.gameCallbacks, data);
    } catch (error) {
      console.error('Error fetching game details:', error);
    }
  }

  // Unsubscribe from matches events
  unsubscribeFromMatches() {
    if (this.channels.matches) {
      supabase.removeChannel(this.channels.matches);
      this.channels.matches = null;
      console.log('Unsubscribed from matches events');
    }
  }

  // Unsubscribe from queue events
  unsubscribeFromQueue() {
    if (this.channels.queue) {
      supabase.removeChannel(this.channels.queue);
      this.channels.queue = null;
      console.log('Unsubscribed from queue events');
    }
  }

  // Unsubscribe from games events
  unsubscribeFromGames() {
    if (this.channels.games) {
      supabase.removeChannel(this.channels.games);
      this.channels.games = null;
      console.log('Unsubscribed from games events');
    }
  }

  // Notify callbacks with data
  notifyCallbacks(callbacks, data) {
    if (!data) return;

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in callback:', error);
      }
    });
  }

  // Handle match updates
  handleMatchUpdate(matchData) {
    this.notifyCallbacks(this.matchCallbacks, matchData);
  }

  // Register a callback for match updates
  onMatch(callback) {
    if (typeof callback === 'function') {
      this.matchCallbacks.push(callback);
    }
  }

  // Remove a callback for match updates
  offMatch(callback) {
    this.matchCallbacks = this.matchCallbacks.filter(cb => cb !== callback);
  }

  // Register a callback for game updates
  onGameUpdate(callback) {
    if (typeof callback === 'function') {
      this.gameCallbacks.push(callback);
    }
  }

  // Remove a callback for game updates
  offGameUpdate(callback) {
    this.gameCallbacks = this.gameCallbacks.filter(cb => cb !== callback);
  }

  // Register a callback for queue updates
  onQueueUpdate(callback) {
    if (typeof callback === 'function') {
      this.queueCallbacks.push(callback);
    }
  }

  // Remove a callback for queue updates
  offQueueUpdate(callback) {
    this.queueCallbacks = this.queueCallbacks.filter(cb => cb !== callback);
  }

  // Find potential matches manually
  async findPotentialMatches() {
    if (!this.isInitialized) {
      console.error('Matchmaking service not initialized properly');
      return { success: false, error: 'Not initialized' };
    }

    try {
      // Get user's preferences
      const { data: queueData, error: queueError } = await supabase
        .from(TABLES.MATCHMAKING_QUEUE)
        .select('preferences')
        .eq('user_id', this.userId)
        .single();

      if (queueError) throw queueError;

      const preferences = queueData?.preferences || {
        sports: this.userProfile.preferred_sports || [],
        skill_level: 'all',
        max_distance: 10,
      };

      // Find potential matches based on preferences
      const { data: matches, error } = await supabase.rpc('find_potential_matches', {
        p_user_id: this.userId,
        p_latitude: this.userLocation.latitude,
        p_longitude: this.userLocation.longitude,
        p_max_distance: preferences.max_distance,
        p_sports: preferences.sports,
        p_skill_level: preferences.skill_level,
      });

      if (error) throw error;

      return { success: true, matches };
    } catch (error) {
      console.error('Error finding potential matches:', error);
      return { success: false, error };
    }
  }

  // Join a game
  async joinGame(gameId) {
    if (!this.isInitialized || !this.userId) {
      return { success: false, error: 'Not initialized' };
    }

    try {
      // Check if already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from(TABLES.GAME_PARTICIPANTS)
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', this.userId)
        .single();

      if (existingParticipant) {
        return { success: true, message: 'Already joined this game' };
      }

      // Join the game
      const { error } = await supabase
        .from(TABLES.GAME_PARTICIPANTS)
        .insert({
          game_id: gameId,
          user_id: this.userId,
          status: 'joined'
        });

      if (error) {
        console.error('Error joining game:', error);
        return { success: false, error: error.message || 'Failed to join the game' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error joining game:', error);
      return { success: false, error: error.message || 'Failed to join the game' };
    }
  }

  // Leave a game
  async leaveGame(gameId) {
    if (!this.isInitialized || !this.userId) {
      return { success: false, error: 'Not initialized' };
    }

    try {
      const { error } = await supabase
        .from(TABLES.GAME_PARTICIPANTS)
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error leaving game:', error);
        return { success: false, error: error.message || 'Failed to leave the game' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error leaving game:', error);
      return { success: false, error: error.message || 'Failed to leave the game' };
    }
  }

  // Delete a match and its associated chat messages
  async deleteMatch(matchId) {
    if (!this.isInitialized || !this.userId) {
      return { success: false, error: 'Not initialized' };
    }

    try {
      // First check if the user is part of this match
      const { data: matchData, error: matchError } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .eq('id', matchId)
        .or(`user_id.eq.${this.userId},matched_user_id.eq.${this.userId}`)
        .single();

      if (matchError) {
        console.error('Error checking match ownership:', matchError);
        return { success: false, error: 'Match not found or you do not have permission to delete it' };
      }

      // Try to use the database function for atomic deletion
      const { data: result, error: functionError } = await supabase
        .rpc('delete_match_with_messages', { match_id_param: matchId });

      if (functionError) {
        console.error('Error using delete_match_with_messages function:', functionError);

        // Fallback: Delete manually if the function fails
        console.log('Falling back to manual deletion');

        // Delete chat messages first
        const { error: chatError } = await supabase
          .from('chat_messages')
          .delete()
          .eq('match_id', matchId);

        if (chatError) {
          console.error('Error deleting chat messages:', chatError);
          // Continue with match deletion even if messages deletion fails
        }

        // Then delete the match
        const { error: deleteError } = await supabase
          .from(TABLES.MATCHES)
          .delete()
          .eq('id', matchId);

        if (deleteError) {
          console.error('Error deleting match:', deleteError);
          return { success: false, error: deleteError.message || 'Failed to delete the match' };
        }
      }

      console.log('Match and messages successfully deleted');
      return { success: true };
    } catch (error) {
      console.error('Error deleting match:', error);
      return { success: false, error: error.message || 'Failed to delete the match' };
    }
  }
}

// Create and export a singleton instance
const matchmakingService = new MatchmakingService();
export default matchmakingService;
