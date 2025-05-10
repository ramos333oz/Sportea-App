import { supabase } from '../services/supabase';
import { TABLES } from '../constants/database';
import { Game } from '../types/database';

export const gameUtils = {
  getGames: async (filters?: { sport?: string; skillLevel?: string }) => {
    try {
      let query = supabase
        .from(TABLES.GAMES)
        .select(`
          *,
          host:profiles(username, avatar_url),
          participants:participants(*)
        `);

      if (filters) {
        if (filters.sport && filters.sport !== 'all') {
          query = query.eq('sport_type', filters.sport);
        }
        if (filters.skillLevel && filters.skillLevel !== 'all') {
          query = query.eq('skill_level', filters.skillLevel);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return { games: data || [], error: null };
    } catch (error) {
      console.error('Error in getGames:', error);
      return { games: [], error };
    }
  },

  createGame: async (gameData: Partial<Game>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .insert([gameData])
        .select()
        .single();

      if (error) throw error;

      return { game: data, error: null };
    } catch (error) {
      console.error('Error in createGame:', error);
      return { game: null, error };
    }
  },

  joinGame: async (gameId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .insert([
          { game_id: gameId, user_id: userId }
        ])
        .select()
        .single();

      if (error) throw error;

      return { participant: data, error: null };
    } catch (error) {
      console.error('Error in joinGame:', error);
      return { participant: null, error };
    }
  },

  leaveGame: async (gameId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .delete()
        .match({ game_id: gameId, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      return { participant: data, error: null };
    } catch (error) {
      console.error('Error in leaveGame:', error);
      return { participant: null, error };
    }
  }
}; 