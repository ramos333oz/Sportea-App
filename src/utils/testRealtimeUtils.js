import { supabase } from '../config/supabase';

// Utility functions to test realtime functionality

/**
 * Create a test game to verify realtime functionality
 * @param {string} hostId - The ID of the user hosting the game
 * @returns {Promise<Object>} - The created game data
 */
export const createTestGame = async (hostId) => {
  try {
    if (!hostId) {
      console.error('Host ID is required');
      return { success: false, error: 'Host ID is required' };
    }
    
    // Create a new game
    const gameData = {
      title: `Test Game ${new Date().toLocaleTimeString()}`,
      description: 'This is a test game created to test realtime functionality',
      sport: 'Basketball',
      skill_level: 'Intermediate',
      date: new Date().toISOString().split('T')[0],
      start_time: '18:00:00',
      end_time: '20:00:00',
      required_players: 10,
      host_id: hostId,
      location: 'Test Location',
      status: 'open'
    };
    
    console.log('Creating test game with data:', gameData);
    
    const { data, error } = await supabase
      .from('games')
      .insert(gameData)
      .select();
    
    if (error) {
      console.error('Error creating game:', error);
      return { success: false, error };
    }
    
    console.log('Game created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
};

/**
 * Update a test game to verify realtime functionality
 * @param {string} gameId - The ID of the game to update
 * @returns {Promise<Object>} - The updated game data
 */
export const updateTestGame = async (gameId) => {
  try {
    if (!gameId) {
      console.error('Game ID is required');
      return { success: false, error: 'Game ID is required' };
    }
    
    // Update the game
    const updateData = {
      title: `Updated Game ${new Date().toLocaleTimeString()}`,
      description: 'This game was updated to test realtime functionality',
    };
    
    console.log('Updating game with data:', updateData);
    
    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
      .select();
    
    if (error) {
      console.error('Error updating game:', error);
      return { success: false, error };
    }
    
    console.log('Game updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
};

/**
 * Delete a test game to verify realtime functionality
 * @param {string} gameId - The ID of the game to delete
 * @returns {Promise<Object>} - Result of the operation
 */
export const deleteTestGame = async (gameId) => {
  try {
    if (!gameId) {
      console.error('Game ID is required');
      return { success: false, error: 'Game ID is required' };
    }
    
    console.log('Deleting game:', gameId);
    
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId);
    
    if (error) {
      console.error('Error deleting game:', error);
      return { success: false, error };
    }
    
    console.log('Game deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
};
