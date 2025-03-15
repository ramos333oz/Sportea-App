import { supabase, SQL_CREATE_TABLES, SQL_TRIGGERS, SQL_SAMPLE_DATA } from '../config/supabase';

/**
 * Script to set up the database tables for the Sportea app
 * Run this script using: npx babel-node src/scripts/setupDatabase.js
 */

const createTables = async () => {
  console.log('🚀 Starting database setup...');

  try {
    // Enable the UUID extension
    console.log('▶️ Enabling UUID extension...');
    const { error: uuidError } = await supabase.rpc('extension', {
      name: 'uuid-ossp'
    });

    if (uuidError) {
      console.error('❌ Error enabling UUID extension:', uuidError);
    } else {
      console.log('✅ UUID extension enabled');
    }

    // Create tables
    console.log('▶️ Creating tables...');
    
    // Courts table first (since it's referenced by the Games table)
    console.log('▶️ Creating courts table...');
    const { error: courtsError } = await supabase.rpc('query', {
      query: SQL_CREATE_TABLES.COURTS
    });
    
    if (courtsError) {
      console.error('❌ Error creating courts table:', courtsError);
    } else {
      console.log('✅ Courts table created');
    }
    
    // Profiles table next (since it's referenced by Games table)
    console.log('▶️ Creating profiles table...');
    const { error: profilesError } = await supabase.rpc('query', {
      query: SQL_CREATE_TABLES.PROFILES
    });
    
    if (profilesError) {
      console.error('❌ Error creating profiles table:', profilesError);
    } else {
      console.log('✅ Profiles table created');
    }
    
    // Games table
    console.log('▶️ Creating games table...');
    const { error: gamesError } = await supabase.rpc('query', {
      query: SQL_CREATE_TABLES.GAMES
    });
    
    if (gamesError) {
      console.error('❌ Error creating games table:', gamesError);
    } else {
      console.log('✅ Games table created');
    }
    
    // Game Participants table
    console.log('▶️ Creating game_participants table...');
    const { error: participantsError } = await supabase.rpc('query', {
      query: SQL_CREATE_TABLES.GAME_PARTICIPANTS
    });
    
    if (participantsError) {
      console.error('❌ Error creating game_participants table:', participantsError);
    } else {
      console.log('✅ Game participants table created');
    }
    
    // Discussions table
    console.log('▶️ Creating discussions table...');
    const { error: discussionsError } = await supabase.rpc('query', {
      query: SQL_CREATE_TABLES.DISCUSSIONS
    });
    
    if (discussionsError) {
      console.error('❌ Error creating discussions table:', discussionsError);
    } else {
      console.log('✅ Discussions table created');
    }
    
    // Create triggers for timestamp updates
    console.log('▶️ Creating triggers...');
    const { error: triggersError } = await supabase.rpc('query', {
      query: SQL_TRIGGERS
    });
    
    if (triggersError) {
      console.error('❌ Error creating triggers:', triggersError);
    } else {
      console.log('✅ Triggers created');
    }
    
    // Insert sample data
    console.log('▶️ Inserting sample courts data...');
    const { error: sampleDataError } = await supabase.rpc('query', {
      query: SQL_SAMPLE_DATA.COURTS
    });
    
    if (sampleDataError) {
      console.error('❌ Error inserting sample data:', sampleDataError);
    } else {
      console.log('✅ Sample data inserted');
    }
    
    console.log('🎉 Database setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
};

// Run the setup
createTables(); 