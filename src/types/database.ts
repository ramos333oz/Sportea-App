export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  date: string;
  time: string;
  location: string;
  location_lat: number | null;
  location_lng: number | null;
  host_id: string;
  max_participants: number;
  skill_level: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  game_id: string;
  user_id: string;
  status: 'joined' | 'left' | 'kicked' | 'banned';
  joined_at: string;
}

export interface GameChat {
  id: string;
  game_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_sports: string[];
  skill_levels: Record<string, string>;
  availability: string | null;
  created_at: string;
  updated_at: string;
}

export type SportType = 'basketball' | 'football' | 'volleyball' | 'badminton' | 'table-tennis';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Game, 'id' | 'created_at' | 'updated_at'>>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'joined_at'>;
        Update: Partial<Omit<Participant, 'id' | 'game_id' | 'user_id' | 'joined_at'>>;
      };
      game_chats: {
        Row: GameChat;
        Insert: Omit<GameChat, 'id' | 'created_at'>;
        Update: never;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
} 