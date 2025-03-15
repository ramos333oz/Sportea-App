import { createClient } from '@supabase/supabase-js';
import SecureStore from '../utils/secureStoreAdapter';
import { Platform } from 'react-native';

// Import URL polyfill only for non-web platforms
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

// Get credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vzigidvhgyvketpnruqa.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aWdpZHZoZ3l2a2V0cG5ydXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwMjUsImV4cCI6MjA1NzYwMzAyNX0.ECEkZ73U45K-DGKpScPlx-xfgmK_Ss5cgo3HhW_1Ih8';

// Custom storage for React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only enable for web
  },
});

// Helper function to check and create a profile if needed
const ensureProfileExists = async (user: any) => {
  if (!user) return;
  
  try {
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    // If no profile exists or there was an error, create one
    if (!data || error) {
      const userData = user.user_metadata || {};
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: userData.username || user.email?.split('@')[0],
            full_name: userData.full_name || '',
            avatar_url: null,
            updated_at: new Date(),
          },
        ]);
      
      if (insertError) {
        console.error('Error creating missing profile:', insertError);
      }
    }
  } catch (e) {
    console.error('Error ensuring profile exists:', e);
  }
};

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If sign in is successful, ensure the user has a profile
    if (data?.user && !error) {
      await ensureProfileExists(data.user);
    }
    
    return { data, error };
  } catch (e) {
    console.error('Error signing in:', e);
    return { data: null, error: e };
  }
};

export const signUp = async (email: string, password: string, userData?: { username?: string, full_name?: string }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      }
    });
    
    // If sign up is successful, create a profile entry
    if (data?.user && !error) {
      // Wait briefly to ensure the session is established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the current session to ensure we're authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: userData?.username,
              full_name: userData?.full_name,
              avatar_url: null,
              updated_at: new Date(),
            },
          ]);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      } else {
        console.log('Session not established, profile will be created on next login');
      }
    }
    
    return { data, error };
  } catch (e) {
    console.error('Error signing up:', e);
    return { data: null, error: e };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (e) {
    console.error('Error signing out:', e);
    return { error: e };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'sportea://reset-password',
    });
    return { data, error };
  } catch (e) {
    console.error('Error resetting password:', e);
    return { data: null, error: e };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  } catch (e) {
    console.error('Error getting current user:', e);
    return { data: null, error: e };
  }
};

export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  } catch (e) {
    console.error('Error getting session:', e);
    return { data: null, error: e };
  }
};

// Set up auth state change subscription
export const setupAuthSubscription = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
}; 