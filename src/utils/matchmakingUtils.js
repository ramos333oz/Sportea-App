import { supabase } from '../config/supabase';
import { TABLES } from '../config/supabase';

/**
 * Utility functions for matchmaking functionality
 */
const matchmakingUtils = {
  /**
   * Create or update a user's matchmaking preferences
   * @param {string} userId - The user's ID
   * @param {Object} preferences - Matchmaking preferences
   * @returns {Promise<Object>} - Result of the operation
   */
  async updatePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .upsert({
          user_id: userId,
          preferences,
          status: 'searching',
          last_updated: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating matchmaking preferences:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Get a user's matchmaking status
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - User's matchmaking status
   */
  async getStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      return { 
        success: true, 
        isActive: data?.status === 'searching',
        data 
      };
    } catch (error) {
      console.error('Error getting matchmaking status:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Stop matchmaking for a user
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async stopMatchmaking(userId) {
    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .update({ status: 'inactive' })
        .eq('user_id', userId);
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error stopping matchmaking:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Get a user's matches
   * @param {string} userId - The user's ID
   * @param {string} status - Match status filter (optional)
   * @returns {Promise<Object>} - User's matches
   */
  async getMatches(userId, status = null) {
    try {
      let query = supabase
        .from('matches')
        .select(`
          *,
          matched_user:matched_user_id(id, username, full_name, avatar_url, preferred_sports, skill_levels),
          initiator:user_id(id, username, full_name, avatar_url, preferred_sports, skill_levels),
          game:game_id(*)
        `)
        .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
        
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Format the matches data
      const formattedMatches = data.map(match => {
        const isInitiator = match.user_id === userId;
        const otherUser = isInitiator ? match.matched_user : match.initiator;
        
        return {
          ...match,
          otherUser,
          isInitiator
        };
      });
      
      return { success: true, matches: formattedMatches };
    } catch (error) {
      console.error('Error getting matches:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Update a match status
   * @param {string} matchId - The match ID
   * @param {string} status - New status (accepted, rejected, expired)
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateMatchStatus(matchId, status) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', matchId);
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating match status:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Create a match between two users
   * @param {string} userId - The initiating user's ID
   * @param {string} matchedUserId - The matched user's ID
   * @param {string} message - Optional message
   * @param {string} gameId - Optional game ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async createMatch(userId, matchedUserId, message = null, gameId = null) {
    try {
      // Call the create_match function
      const { data, error } = await supabase.rpc('create_match', {
        p_user_id: userId,
        p_matched_user_id: matchedUserId,
        p_game_id: gameId,
        p_match_type: gameId ? 'game' : 'player',
        p_message: message
      });
      
      if (error) throw error;
      return { success: true, matchId: data };
    } catch (error) {
      console.error('Error creating match:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Subscribe to match updates
   * @param {string} userId - The user's ID
   * @param {Function} callback - Callback function for match updates
   * @returns {Object} - Subscription object
   */
  subscribeToMatches(userId, callback) {
    const subscription = supabase
      .channel('matches-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        callback(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `matched_user_id=eq.${userId}`,
      }, (payload) => {
        callback(payload);
      })
      .subscribe();
      
    return subscription;
  },
  
  /**
   * Find potential matches for a user
   * @param {string} userId - The user's ID
   * @param {Object} location - User's location {latitude, longitude}
   * @param {Object} preferences - Matchmaking preferences
   * @returns {Promise<Object>} - Potential matches
   */
  async findPotentialMatches(userId, location, preferences) {
    try {
      if (!location || !location.latitude || !location.longitude) {
        throw new Error('Location is required for matchmaking');
      }
      
      const { data, error } = await supabase.rpc('find_potential_matches', {
        p_user_id: userId,
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_max_distance: preferences.maxDistance || 10,
        p_sports: preferences.sports || null,
        p_skill_level: preferences.skillLevel || 'all',
      });
      
      if (error) throw error;
      return { success: true, matches: data };
    } catch (error) {
      console.error('Error finding potential matches:', error);
      return { success: false, error };
    }
  }
};

export default matchmakingUtils;
