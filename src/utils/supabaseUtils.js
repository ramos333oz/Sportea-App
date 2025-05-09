import { supabase, TABLES } from '../config/supabase';

// Authentication utilities
export const authUtils = {
  // Sign up a new user
  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  },
  
  // Sign in an existing user
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  },
  
  // Sign out the current user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  },
  
  // Reset password
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'sportea://reset-password',
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  },
  
  // Get the current session
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { session: null, error };
    }
  },
  
  // Get the current user
  getUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Error getting user:', error);
      return { user: null, error };
    }
  }
};

// Profile utilities
export const profileUtils = {
  // Create a new profile
  createProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert([{ id: userId, ...profileData }])
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error };
    }
  },
  
  // Get a profile by user ID
  getProfileById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { profile: null, error };
    }
  },
  
  // Update a profile
  updateProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(profileData)
        .eq('id', userId)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  }
};

// Game utilities
export const gameUtils = {
  // Create a new game
  createGame: async (gameData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .insert([gameData])
        .select();
      
      if (error) throw error;
      return { game: data[0], error: null };
    } catch (error) {
      console.error('Error creating game:', error);
      return { game: null, error };
    }
  },
  
  // Get all games with filters
  getGames: async (filters = {}) => {
    try {
      let query = supabase
        .from(TABLES.GAMES)
        .select(`
          *,
          host:profiles(*),
          court:courts(*),
          participants:game_participants(*)
        `);
      
      // Apply filters if any
      if (filters.sport) {
        query = query.eq('sport', filters.sport);
      }
      
      if (filters.skillLevel) {
        query = query.eq('skill_level', filters.skillLevel);
      }
      
      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Order by date and time
      query = query.order('date', { ascending: true }).order('start_time', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { games: data, error: null };
    } catch (error) {
      console.error('Error getting games:', error);
      return { games: [], error };
    }
  },
  
  // Get a single game by ID
  getGameById: async (gameId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select(`
          *,
          host:profiles(*),
          court:courts(*),
          participants:game_participants(user_id, status, profiles(*))
        `)
        .eq('id', gameId)
        .single();
      
      if (error) throw error;
      return { game: data, error: null };
    } catch (error) {
      console.error('Error getting game:', error);
      return { game: null, error };
    }
  },
  
  // Update a game
  updateGame: async (gameId, gameData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .update(gameData)
        .eq('id', gameId)
        .select();
      
      if (error) throw error;
      return { game: data[0], error: null };
    } catch (error) {
      console.error('Error updating game:', error);
      return { game: null, error };
    }
  },
  
  // Delete a game
  deleteGame: async (gameId) => {
    try {
      // First delete all game participants
      const { error: participantsError } = await supabase
        .from(TABLES.GAME_PARTICIPANTS)
        .delete()
        .eq('game_id', gameId);
      
      if (participantsError) {
        console.error('Error deleting game participants:', participantsError);
        // Continue with game deletion even if participants deletion fails
      }
      
      // Then delete the game itself
      const { error } = await supabase
        .from(TABLES.GAMES)
        .delete()
        .eq('id', gameId);
      
      if (error) throw error;
      
      console.log('Game and participants successfully deleted');
      return { error: null };
    } catch (error) {
      console.error('Error deleting game:', error);
      return { error };
    }
  },
  
  // Join a game
  joinGame: async (gameId, userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAME_PARTICIPANTS)
        .insert([{ game_id: gameId, user_id: userId }])
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error joining game:', error);
      return { data: null, error };
    }
  },
  
  // Leave a game
  leaveGame: async (gameId, userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAME_PARTICIPANTS)
        .update({ status: 'left' })
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error leaving game:', error);
      return { data: null, error };
    }
  }
};

// Court utilities
export const courtUtils = {
  // Get all courts
  getCourts: async (filters = {}) => {
    try {
      let query = supabase
        .from(TABLES.COURTS)
        .select('*');
      
      // Apply filters if any
      if (filters.sport) {
        query = query.eq('sport', filters.sport);
      }
      
      if (filters.indoor !== undefined) {
        query = query.eq('indoor', filters.indoor);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { courts: data, error: null };
    } catch (error) {
      console.error('Error getting courts:', error);
      return { courts: [], error };
    }
  },
  
  // Get a court by ID
  getCourtById: async (courtId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURTS)
        .select('*')
        .eq('id', courtId)
        .single();
      
      if (error) throw error;
      return { court: data, error: null };
    } catch (error) {
      console.error('Error getting court:', error);
      return { court: null, error };
    }
  },
  
  // Create a new court
  createCourt: async (courtData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURTS)
        .insert([courtData])
        .select();
      
      if (error) throw error;
      return { court: data[0], error: null };
    } catch (error) {
      console.error('Error creating court:', error);
      return { court: null, error };
    }
  }
};

// Discussion utilities
export const discussionUtils = {
  // Get discussions for a game
  getDiscussions: async (gameId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DISCUSSIONS)
        .select(`
          *,
          user:profiles(id, username, avatar_url)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return { discussions: data, error: null };
    } catch (error) {
      console.error('Error getting discussions:', error);
      return { discussions: [], error };
    }
  },
  
  // Add a message to the discussion
  addMessage: async (gameId, userId, message) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DISCUSSIONS)
        .insert([{ game_id: gameId, user_id: userId, message }])
        .select();
      
      if (error) throw error;
      return { message: data[0], error: null };
    } catch (error) {
      console.error('Error adding message:', error);
      return { message: null, error };
    }
  },
  
  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from(TABLES.DISCUSSIONS)
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error };
    }
  },
  
  // Subscribe to new messages in a game
  subscribeToMessages: (gameId, callback) => {
    return supabase
      .channel(`game-${gameId}-discussions`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.DISCUSSIONS,
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  }
}; 