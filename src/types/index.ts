// User related types
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Profile {
  id: string;
  bio?: string;
  universityId: string;
  yearOfStudy?: number;
  faculty?: string;
  availabilitySchedule?: AvailabilitySchedule;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export interface SportPreference {
  id: string;
  userId: string;
  sportId: string;
  skillLevel: SkillLevel;
  isFavorite: boolean;
  createdAt: string;
}

// Sport related types
export interface Sport {
  id: string;
  name: string;
  iconUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  createdAt: string;
}

// Game related types
export type GameStatus = 'open' | 'full' | 'canceled' | 'completed';

export interface Game {
  id: string;
  hostId: string;
  sportId: string;
  title: string;
  description?: string;
  locationId: string;
  courtId?: string;
  startTime: string;
  endTime: string;
  requiredPlayers: number;
  skillLevelRequired?: SkillLevel;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
}

export type ParticipantStatus = 'pending' | 'approved' | 'rejected' | 'left';

export interface GameParticipant {
  id: string;
  gameId: string;
  userId: string;
  status: ParticipantStatus;
  joinedAt: string;
  updatedAt: string;
}

// Location related types
export interface Location {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface Court {
  id: string;
  locationId: string;
  name: string;
  sportId: string;
  capacity?: number;
  isIndoor: boolean;
  imageUrl?: string;
  createdAt: string;
}

// Booking related types
export type BookingStatus = 'pending' | 'confirmed' | 'canceled';

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  gameId?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  externalBookingId?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification related types
export type NotificationType = 
  | 'game_invite' 
  | 'join_request' 
  | 'join_approved' 
  | 'join_rejected' 
  | 'game_update' 
  | 'game_canceled' 
  | 'booking_confirmed' 
  | 'booking_canceled';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  content: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
} 