import { supabase } from '../config/supabase';

// Define table names
const TABLES = {
  GAMES: 'games',
  GAME_PARTICIPANTS: 'game_participants',
  PROFILES: 'profiles'
};

// RealtimeService to handle Supabase realtime subscriptions
class RealtimeService {
  constructor() {
    this.channels = {
      games: null,
      participants: null
    };
    this.gameCallbacks = [];
    this.participantCallbacks = [];
    this.isInitialized = false;
  }

  // Initialize the service
  initialize() {
    if (!this.isInitialized) {
      this.subscribeToGames();
      this.subscribeToParticipants();
      this.isInitialized = true;
      console.log('Realtime service initialized');
    }
    return this.isInitialized;
  }

  // Clean up subscriptions
  cleanup() {
    this.unsubscribeFromGames();
    this.unsubscribeFromParticipants();
    this.isInitialized = false;
    console.log('Realtime service cleaned up');
  }

  // Subscribe to games table for realtime updates
  subscribeToGames() {
    if (this.channels.games) {
      this.unsubscribeFromGames();
    }

    try {
      // Subscribe to all game events (INSERT, UPDATE, DELETE)
      this.channels.games = supabase
        .channel('public-games-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.GAMES,
        }, (payload) => {
          console.log('New game created:', payload);
          // Notify callbacks with the new game data
          this.notifyGameCallbacks({
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
          this.notifyGameCallbacks({
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
          this.notifyGameCallbacks({
            ...payload.old,
            eventType: 'DELETE'
          });
        })
        .subscribe((status) => {
          console.log(`Games channel status: ${status}`);
        });

      console.log('Subscribed to games events');
      return true;
    } catch (error) {
      console.error('Error subscribing to games:', error);
      return false;
    }
  }

  // Subscribe to game participants table for realtime updates
  subscribeToParticipants() {
    if (this.channels.participants) {
      this.unsubscribeFromParticipants();
    }

    try {
      this.channels.participants = supabase
        .channel('public-participants-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLES.GAME_PARTICIPANTS,
        }, (payload) => {
          console.log('Game participant update:', payload);
          this.notifyParticipantCallbacks({
            ...payload.new || payload.old,
            eventType: payload.eventType
          });
        })
        .subscribe((status) => {
          console.log(`Participants channel status: ${status}`);
        });

      console.log('Subscribed to game participants events');
      return true;
    } catch (error) {
      console.error('Error subscribing to game participants:', error);
      return false;
    }
  }

  // Unsubscribe from games channel
  unsubscribeFromGames() {
    if (this.channels.games) {
      supabase.removeChannel(this.channels.games);
      this.channels.games = null;
      console.log('Unsubscribed from games events');
    }
  }

  // Unsubscribe from participants channel
  unsubscribeFromParticipants() {
    if (this.channels.participants) {
      supabase.removeChannel(this.channels.participants);
      this.channels.participants = null;
      console.log('Unsubscribed from participants events');
    }
  }

  // Register a callback for game updates
  onGameUpdate(callback) {
    if (typeof callback === 'function' && !this.gameCallbacks.includes(callback)) {
      this.gameCallbacks.push(callback);
      return true;
    }
    return false;
  }

  // Remove a callback for game updates
  offGameUpdate(callback) {
    this.gameCallbacks = this.gameCallbacks.filter(cb => cb !== callback);
  }

  // Register a callback for participant updates
  onParticipantUpdate(callback) {
    if (typeof callback === 'function' && !this.participantCallbacks.includes(callback)) {
      this.participantCallbacks.push(callback);
      return true;
    }
    return false;
  }

  // Remove a callback for participant updates
  offParticipantUpdate(callback) {
    this.participantCallbacks = this.participantCallbacks.filter(cb => cb !== callback);
  }

  // Notify game callbacks
  notifyGameCallbacks(data) {
    if (!data) return;
    
    this.gameCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in game callback:', error);
      }
    });
  }

  // Notify participant callbacks
  notifyParticipantCallbacks(data) {
    if (!data) return;
    
    this.participantCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in participant callback:', error);
      }
    });
  }

  // Fetch all active games
  async fetchActiveGames() {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select(`
          *,
          host:host_id(id, username, full_name, avatar_url),
          participants:${TABLES.GAME_PARTICIPANTS}(*)
        `)
        .eq('status', 'active')
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      
      return { success: true, games: data };
    } catch (error) {
      console.error('Error fetching active games:', error);
      return { success: false, error };
    }
  }
}

// Create and export a singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
