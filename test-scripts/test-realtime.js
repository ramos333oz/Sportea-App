// Test script to create a game and test realtime functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to create a test game
async function createTestGame() {
  try {
    // Get a random user to use as host
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.error('No users found');
      return;
    }
    
    const hostId = users[0].id;
    
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
      return;
    }
    
    console.log('Game created successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
createTestGame()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
