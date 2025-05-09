// Test script to update a game and test realtime functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to update a test game
async function updateTestGame() {
  try {
    // Get the most recent game
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return;
    }
    
    if (!games || games.length === 0) {
      console.error('No games found');
      return;
    }
    
    const gameId = games[0].id;
    console.log(`Updating game: ${games[0].title} (${gameId})`);
    
    // Update the game
    const updateData = {
      title: `Updated Game ${new Date().toLocaleTimeString()}`,
      description: 'This game was updated to test realtime functionality',
    };
    
    console.log('Updating with data:', updateData);
    
    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
      .select();
    
    if (error) {
      console.error('Error updating game:', error);
      return;
    }
    
    console.log('Game updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
updateTestGame()
  .then(() => {
    console.log('Update test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Update test failed:', error);
    process.exit(1);
  });
