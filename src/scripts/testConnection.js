import { supabase } from '../config/supabase';

/**
 * Script to test connection to Supabase
 * Run this script using: npx babel-node src/scripts/testConnection.js
 */

const testConnection = async () => {
  console.log('🔍 Testing Supabase connection...');

  try {
    // Test a simple query to get server version
    const { data, error } = await supabase
      .from('courts')
      .select('count(*)')
      .single();

    if (error) {
      console.error('❌ Connection test failed:', error);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('📊 Court count:', data.count);

    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth connection test failed:', authError);
      return;
    }

    console.log('✅ Auth connection successful!');
    console.log('🔐 Session:', authData.session ? 'Active' : 'None');

  } catch (error) {
    console.error('❌ Error testing connection:', error);
  }
};

// Run the test
testConnection(); 