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
    this.subscription = null;
    this.userId = null;
    this.userProfile = null;
    this.userLocation = null;
    this.matchCallbacks = [];
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
    if (!this.userId || !this.userProfile) {
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
      this.subscribeToMatches();
      
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
      this.unsubscribeFromMatches();
      
      console.log('Stopped matchmaking');
      return true;
    } catch (error) {
      console.error('Error stopping matchmaking:', error);
      return false;
    }
  }
  
  // Subscribe to matchmaking events
  subscribeToMatches() {
    // Unsubscribe from any existing subscription
    this.unsubscribeFromMatches();
    
    // Subscribe to matches table for this user
    this.subscription = supabase
      .channel('matchmaking-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.MATCHES,
        filter: `user_id=eq.${this.userId}`,
      }, (payload) => {
        console.log('Received match update:', payload);
        this.handleMatchUpdate(payload.new);
      })
      .subscribe();
      
    console.log('Subscribed to matchmaking events');
  }
  
  // Unsubscribe from matchmaking events
  unsubscribeFromMatches() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      console.log('Unsubscribed from matchmaking events');
    }
  }
  
  // Handle match updates
  handleMatchUpdate(matchData) {
    if (!matchData) return;
    
    // Notify all registered callbacks
    this.matchCallbacks.forEach(callback => {
      try {
        callback(matchData);
      } catch (error) {
        console.error('Error in match callback:', error);
      }
    });
  }
  
  // Register a callback for match updates
  onMatch(callback) {
    if (typeof callback === 'function') {
      this.matchCallbacks.push(callback);
    }
  }
  
  // Remove a callback
  offMatch(callback) {
    this.matchCallbacks = this.matchCallbacks.filter(cb => cb !== callback);
  }
  
  // Find potential matches manually
  async findPotentialMatches() {
    if (!this.userId || !this.userProfile || !this.userLocation) {
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
}

// Create and export a singleton instance
const matchmakingService = new MatchmakingService();
export default matchmakingService;
