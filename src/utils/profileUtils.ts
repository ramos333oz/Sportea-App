import { supabase } from '../services/supabase';
import { TABLES } from '../constants/database';

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    return { data: null, error };
  }
};

export const getUserStats = async (userId: string) => {
  try {
    // Get games hosted by user
    const { data: hostedGames, error: hostedError } = await supabase
      .from(TABLES.GAMES)
      .select('id')
      .eq('host_id', userId);

    if (hostedError) throw hostedError;

    // Get games participated in
    const { data: participatedGames, error: participatedError } = await supabase
      .from(TABLES.PARTICIPANTS)
      .select('game_id')
      .eq('user_id', userId)
      .eq('status', 'joined');

    if (participatedError) throw participatedError;

    // Get sports played
    const { data: sportsPlayed, error: sportsError } = await supabase
      .from(TABLES.GAMES)
      .select('sport_type')
      .in('id', [...(participatedGames?.map(p => p.game_id) || [])]);

    if (sportsError) throw sportsError;

    // Count sports frequency
    const sportsCount = sportsPlayed?.reduce((acc, game) => {
      acc[game.sport_type] = (acc[game.sport_type] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      gamesHosted: hostedGames?.length || 0,
      gamesPlayed: participatedGames?.length || 0,
      sportsPlayed: Object.entries(sportsCount || {}).map(([name, count]) => ({
        name,
        count,
      })),
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching user stats:', error.message);
    return { data: null, error };
  }
};

export const getUserGames = async (userId: string) => {
  try {
    // Get hosted games
    const { data: hosted, error: hostedError } = await supabase
      .from(TABLES.GAMES)
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false });

    if (hostedError) throw hostedError;

    // Get participated games
    const { data: participated, error: participatedError } = await supabase
      .from(TABLES.PARTICIPANTS)
      .select('game_id')
      .eq('user_id', userId)
      .eq('status', 'joined');

    if (participatedError) throw participatedError;

    // Get full game details for participated games
    const { data: joined, error: joinedError } = await supabase
      .from(TABLES.GAMES)
      .select('*')
      .in('id', participated?.map(p => p.game_id) || [])
      .order('created_at', { ascending: false });

    if (joinedError) throw joinedError;

    // Combine all games
    const allGames = [...(hosted || []), ...(joined || [])];
    const uniqueGames = Array.from(new Set(allGames.map(g => g.id)))
      .map(id => allGames.find(g => g.id === id));

    return {
      data: {
        all: uniqueGames,
        hosted: hosted || [],
        joined: joined || [],
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user games:', error.message);
    return { data: null, error };
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    return { data: null, error };
  }
};