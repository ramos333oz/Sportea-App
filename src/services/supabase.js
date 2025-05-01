import { supabase } from '../config/supabase';

// Function to sign up a new user
export const signUp = async (email, password, userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { data: null, error: { message: 'An unexpected error occurred' } };
  }
};

// Function to check if a user is currently logged in
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    return data.session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Re-export supabase client for direct use
export { supabase }; 