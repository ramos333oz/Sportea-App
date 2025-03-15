-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courts table
CREATE TABLE IF NOT EXISTS public.courts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  location JSONB NOT NULL,
  address TEXT,
  capacity INTEGER,
  indoor BOOLEAN DEFAULT FALSE,
  amenities TEXT[]
);

-- Set up Row Level Security
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Courts are viewable by everyone" 
ON public.courts FOR SELECT 
USING (TRUE);

-- Only admins can create/edit courts in production
CREATE POLICY "Anyone can create courts during development" 
ON public.courts FOR INSERT 
USING (TRUE);

CREATE POLICY "Anyone can update courts during development" 
ON public.courts FOR UPDATE 
USING (TRUE);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  preferred_sports TEXT[] DEFAULT '{}',
  skill_levels JSONB DEFAULT '{}'
);

-- Set up Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
USING (auth.uid() = id);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  skill_level TEXT DEFAULT 'all',
  host_id UUID REFERENCES public.profiles(id) NOT NULL,
  court_id UUID REFERENCES public.courts(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_players INTEGER NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'in-progress', 'completed', 'cancelled')),
  location JSONB,
  equipment TEXT,
  fee TEXT DEFAULT 'Free',
  weather_info TEXT
);

-- Set up Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Games are viewable by everyone" 
ON public.games FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can create games" 
ON public.games FOR INSERT 
USING (auth.uid() = host_id);

CREATE POLICY "Hosts can update their games" 
ON public.games FOR UPDATE 
USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their games" 
ON public.games FOR DELETE 
USING (auth.uid() = host_id);

-- Create game_participants table
CREATE TABLE IF NOT EXISTS public.game_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'removed')),
  UNIQUE(game_id, user_id)
);

-- Set up Row Level Security
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Game participants are viewable by everyone" 
ON public.game_participants FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can join games" 
ON public.game_participants FOR INSERT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave games" 
ON public.game_participants FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Game hosts can update participants' status"
ON public.game_participants FOR UPDATE
USING (
  auth.uid() IN (
    SELECT host_id FROM public.games
    WHERE id = game_participants.game_id
  )
);

-- Create discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Discussions are viewable by everyone" 
ON public.discussions FOR SELECT 
USING (TRUE);

CREATE POLICY "Participants can post in discussions"
ON public.discussions FOR INSERT
USING (
  -- Either the user is the host
  auth.uid() IN (
    SELECT host_id FROM public.games
    WHERE id = discussions.game_id
  )
  -- Or the user is a participant
  OR
  auth.uid() IN (
    SELECT user_id FROM public.game_participants
    WHERE game_id = discussions.game_id
    AND status = 'joined'
  )
);

CREATE POLICY "Users can delete their own messages"
ON public.discussions FOR DELETE
USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_games
BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert sample courts data
INSERT INTO public.courts (name, sport, location, address, capacity, indoor, amenities)
VALUES 
  ('Main Basketball Court', 'basketball', '{"latitude": 37.7749, "longitude": -122.4194}', 'University Campus, Building 5', 20, FALSE, '{"water fountains", "restrooms", "seating"}'),
  ('Indoor Sports Hall (Badminton)', 'badminton', '{"latitude": 37.7746, "longitude": -122.4189}', 'University Campus, Sports Complex', 16, TRUE, '{"restrooms", "lockers", "showers"}'),
  ('University Field', 'football', '{"latitude": 37.7753, "longitude": -122.4199}', 'University Campus, North Field', 30, FALSE, '{"restrooms", "water fountains", "lighting"}'),
  ('Recreation Center (Table Tennis)', 'table-tennis', '{"latitude": 37.7738, "longitude": -122.4188}', 'University Campus, Recreation Building', 16, TRUE, '{"restrooms", "lockers", "cafe"}'),
  ('Beach Volleyball Court', 'volleyball', '{"latitude": 37.7736, "longitude": -122.4205}', 'University Beach', 12, FALSE, '{"outdoor showers", "seating"}'),
  ('Second Basketball Court', 'basketball', '{"latitude": 37.7741, "longitude": -122.4197}', 'University Campus, South Building', 16, TRUE, '{"water fountains", "restrooms"}')
ON CONFLICT DO NOTHING; 