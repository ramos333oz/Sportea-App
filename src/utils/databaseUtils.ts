import { supabase } from '../services/supabase';
import { Profile, Game, Participant, UserPreferences, SportType, SkillLevel } from '../types/database';
import { logger } from './logger';
import { AuthErrorCode } from './logger';

// Helper function to format database errors
const handleDatabaseError = (operation: string, error: any) => {
  logger.error(`Error in ${operation}:`, error);
  return {
    data: null,
    error: {
      code: AuthErrorCode.DATABASE_ERROR,
      message: `Failed to ${operation}: ${error.message || 'Unknown error'}`,
      details: error
    }
  };
};

// Profile operations
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('fetch user profile', error);
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('update user profile', error);
  }
};

// Game operations
export const createGame = async (gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .insert([gameData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('create game', error);
  }
};

export const getGames = async (filters?: {
  sport_type?: SportType;
  skill_level?: SkillLevel;
  status?: Game['status'];
  host_id?: string;
}) => {
  try {
    let query = supabase.from('games').select('*, host:profiles(username, avatar_url)');

    if (filters) {
      if (filters.sport_type) query = query.eq('sport_type', filters.sport_type);
      if (filters.skill_level) query = query.eq('skill_level', filters.skill_level);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.host_id) query = query.eq('host_id', filters.host_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('fetch games', error);
  }
};

// Participant operations
export const joinGame = async (gameId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert([{ game_id: gameId, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('join game', error);
  }
};

export const leaveGame = async (gameId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .delete()
      .match({ game_id: gameId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('leave game', error);
  }
};

// User preferences operations
export const getUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('fetch user preferences', error);
  }
};

export const updateUserPreferences = async (
  userId: string,
  updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return handleDatabaseError('update user preferences', error);
  }
}; 