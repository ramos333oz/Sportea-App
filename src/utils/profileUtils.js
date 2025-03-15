import { supabase, TABLES } from '../config/supabase';

/**
 * Utility functions for managing user profiles
 */

/**
 * Get a user's profile by user ID
 * @param {string} userId - The user's ID
 * @returns {Promise} - Object containing data and error
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

/**
 * Update a user's profile
 * @param {string} userId - The user's ID
 * @param {object} updates - Object containing profile updates
 * @returns {Promise} - Object containing data and error
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // Make sure we don't update the ID
    const { id, ...updateData } = updates;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date();
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

/**
 * Get user's game participation
 * @param {string} userId - The user's ID
 * @returns {Promise} - Object containing data and error
 */
export const getUserGames = async (userId) => {
  try {
    // Get games the user is hosting
    const { data: hostedGames, error: hostedError } = await supabase
      .from(TABLES.GAMES)
      .select(`
        *,
        court:${TABLES.COURTS}(*),
        participants:${TABLES.GAME_PARTICIPANTS}(
          *,
          user:${TABLES.PROFILES}(id, username, avatar_url)
        )
      `)
      .eq('host_id', userId);
    
    if (hostedError) throw hostedError;
    
    // Get games the user is participating in but not hosting
    const { data: participatingGames, error: participatingError } = await supabase
      .from(TABLES.GAME_PARTICIPANTS)
      .select(`
        *,
        game:${TABLES.GAMES}(
          *,
          court:${TABLES.COURTS}(*),
          participants:${TABLES.GAME_PARTICIPANTS}(
            *,
            user:${TABLES.PROFILES}(id, username, avatar_url)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'joined');
    
    if (participatingError) throw participatingError;
    
    // Extract game objects from participating games
    const joinedGames = participatingGames
      .map(pg => pg.game)
      .filter(game => game.host_id !== userId); // Filter out games the user is hosting
    
    return { 
      data: {
        hosted: hostedGames || [],
        joined: joinedGames || [],
        all: [...(hostedGames || []), ...(joinedGames || [])]
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching user games:', error);
    return { data: null, error };
  }
};

/**
 * Get user's stats (games played, hosted, sports played)
 * @param {string} userId - The user's ID 
 * @returns {Promise} - Object containing data and error
 */
export const getUserStats = async (userId) => {
  try {
    // Get all games the user has participated in
    const { data: allGames, error } = await getUserGames(userId);
    
    if (error) throw error;
    
    // Calculate stats
    const gamesPlayed = allGames.all.length;
    const gamesHosted = allGames.hosted.length;
    
    // Get unique sports played
    const sportsPlayed = [...new Set(allGames.all.map(game => game.sport))];
    
    // Count upcoming games
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingGames = allGames.all.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate >= today;
    }).length;
    
    return {
      data: {
        gamesPlayed,
        gamesHosted,
        sportsPlayed,
        upcomingGames
      },
      error: null
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return { data: null, error };
  }
}; 