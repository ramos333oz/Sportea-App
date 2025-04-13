// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  GAMES: 'games',
  PARTICIPANTS: 'participants',
  GAME_CHATS: 'game_chats',
  USER_PREFERENCES: 'user_preferences',
};

// Profile fields
export const PROFILE_FIELDS = {
  ID: 'id',
  USERNAME: 'username',
  FULL_NAME: 'full_name',
  AVATAR_URL: 'avatar_url',
  BIO: 'bio',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
};

// Game fields
export const GAME_FIELDS = {
  ID: 'id',
  TITLE: 'title',
  DESCRIPTION: 'description',
  SPORT_TYPE: 'sport_type',
  DATE: 'date',
  TIME: 'time',
  LOCATION: 'location',
  HOST_ID: 'host_id',
  MAX_PARTICIPANTS: 'max_participants',
  SKILL_LEVEL: 'skill_level',
  STATUS: 'status',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
};

// Participant fields
export const PARTICIPANT_FIELDS = {
  ID: 'id',
  GAME_ID: 'game_id',
  USER_ID: 'user_id',
  STATUS: 'status',
  JOINED_AT: 'joined_at',
};