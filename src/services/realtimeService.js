import { supabase } from './supabase';

class RealtimeService {
  constructor() {
    this.subscriptions = {};
    this.callbacks = {
      games: [],
      profiles: [],
      matches: [],
      chat_messages: [],
    };
    this.initialized = false;
  }

  /**
   * Initialize realtime subscriptions
   */
  initialize() {
    if (this.initialized) return;

    // Subscribe to games table
    this.subscriptions.games = supabase
      .channel('public:games')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'games' 
        }, 
        (payload) => this.handleGameChange(payload)
      )
      .subscribe();

    // Subscribe to profiles table
    this.subscriptions.profiles = supabase
      .channel('public:profiles')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload) => this.handleProfileChange(payload)
      )
      .subscribe();

    // Subscribe to matches table
    this.subscriptions.matches = supabase
      .channel('public:matches')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches' 
        }, 
        (payload) => this.handleMatchChange(payload)
      )
      .subscribe();

    // Subscribe to chat_messages table
    this.subscriptions.chat_messages = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages' 
        }, 
        (payload) => this.handleChatMessageChange(payload)
      )
      .subscribe();

    this.initialized = true;
    console.log('Realtime service initialized');
  }

  /**
   * Clean up subscriptions
   */
  cleanup() {
    Object.values(this.subscriptions).forEach(subscription => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    });
    
    this.subscriptions = {};
    this.callbacks = {
      games: [],
      profiles: [],
      matches: [],
      chat_messages: [],
    };
    this.initialized = false;
    
    console.log('Realtime service cleaned up');
  }

  /**
   * Handle game changes
   * @param {Object} payload - The payload from Supabase realtime
   */
  handleGameChange(payload) {
    console.log('Game change:', payload);
    this.callbacks.games.forEach(callback => callback(payload));
  }

  /**
   * Handle profile changes
   * @param {Object} payload - The payload from Supabase realtime
   */
  handleProfileChange(payload) {
    console.log('Profile change:', payload);
    this.callbacks.profiles.forEach(callback => callback(payload));
  }

  /**
   * Handle match changes
   * @param {Object} payload - The payload from Supabase realtime
   */
  handleMatchChange(payload) {
    console.log('Match change:', payload);
    this.callbacks.matches.forEach(callback => callback(payload));
  }

  /**
   * Handle chat message changes
   * @param {Object} payload - The payload from Supabase realtime
   */
  handleChatMessageChange(payload) {
    console.log('Chat message change:', payload);
    this.callbacks.chat_messages.forEach(callback => callback(payload));
  }

  /**
   * Register a callback for game changes
   * @param {Function} callback - The callback function
   * @returns {Function} - Function to unregister the callback
   */
  onGameChange(callback) {
    this.callbacks.games.push(callback);
    return () => {
      this.callbacks.games = this.callbacks.games.filter(cb => cb !== callback);
    };
  }

  /**
   * Register a callback for profile changes
   * @param {Function} callback - The callback function
   * @returns {Function} - Function to unregister the callback
   */
  onProfileChange(callback) {
    this.callbacks.profiles.push(callback);
    return () => {
      this.callbacks.profiles = this.callbacks.profiles.filter(cb => cb !== callback);
    };
  }

  /**
   * Register a callback for match changes
   * @param {Function} callback - The callback function
   * @returns {Function} - Function to unregister the callback
   */
  onMatchChange(callback) {
    this.callbacks.matches.push(callback);
    return () => {
      this.callbacks.matches = this.callbacks.matches.filter(cb => cb !== callback);
    };
  }

  /**
   * Register a callback for chat message changes
   * @param {Function} callback - The callback function
   * @returns {Function} - Function to unregister the callback
   */
  onChatMessageChange(callback) {
    this.callbacks.chat_messages.push(callback);
    return () => {
      this.callbacks.chat_messages = this.callbacks.chat_messages.filter(cb => cb !== callback);
    };
  }

  /**
   * Create a test game for realtime testing
   * @param {string} userId - The user ID
   * @returns {Promise} - The result of the insert
   */
  async createTestGame(userId) {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert([
          {
            title: `Test Game ${Date.now()}`,
            description: 'This is a test game for realtime functionality',
            location: 'Test Location',
            date: new Date().toISOString(),
            time: '12:00',
            duration: 60,
            max_players: 10,
            sport: 'basketball',
            skill_level: 'beginner',
            status: 'open',
            host_id: userId,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating test game:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a test game for realtime testing
   * @param {string} gameId - The game ID
   * @returns {Promise} - The result of the update
   */
  async updateTestGame(gameId) {
    try {
      const { data, error } = await supabase
        .from('games')
        .update({
          title: `Updated Test Game ${Date.now()}`,
          description: 'This game was updated for realtime testing',
        })
        .eq('id', gameId)
        .select();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating test game:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a test game for realtime testing
   * @param {string} gameId - The game ID
   * @returns {Promise} - The result of the delete
   */
  async deleteTestGame(gameId) {
    try {
      const { data, error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .select();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error deleting test game:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
