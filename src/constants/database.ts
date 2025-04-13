export const TABLES = {
  PROFILES: 'profiles',
  GAMES: 'games',
  PARTICIPANTS: 'participants',
  GAME_CHATS: 'game_chats',
  USER_PREFERENCES: 'user_preferences',
} as const;

export type Tables = typeof TABLES;
export type TableNames = keyof Tables;

export const POLICIES = {
  PROFILES: {
    VIEW: 'Anyone can view profiles',
    INSERT: 'Users can insert their own profile',
    UPDATE: 'Users can update their own profile',
  },
  GAMES: {
    VIEW: 'Anyone can view active games',
    INSERT: 'Authenticated users can create games',
    UPDATE: 'Creators can update their games',
  },
} as const;