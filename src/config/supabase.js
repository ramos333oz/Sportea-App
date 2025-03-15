import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Import URL polyfill only for non-web platforms
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

// Use localStorage for web, otherwise use AsyncStorage
let AsyncStorage;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vzigidvhgyvketpnruqa.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aWdpZHZoZ3l2a2V0cG5ydXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwMjUsImV4cCI6MjA1NzYwMzAyNX0.ECEkZ73U45K-DGKpScPlx-xfgmK_Ss5cgo3HhW_1Ih8';

// Storage adapter
const storageAdapter = Platform.OS === 'web' 
  ? {
      getItem: (key) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key, value) => {
        localStorage.setItem(key, value);
        return Promise.resolve(true);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      }
    } 
  : AsyncStorage;

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Table names - used throughout the app for consistency
export const TABLES = {
  PROFILES: 'profiles',
  GAMES: 'games',
  GAME_PARTICIPANTS: 'game_participants',
  COURTS: 'courts',
  DISCUSSIONS: 'discussions',
};

// SQL for creating tables
export const SQL_CREATE_TABLES = {
  PROFILES: `
    create table if not exists public.profiles (
      id uuid references auth.users(id) not null primary key,
      username text unique,
      full_name text,
      avatar_url text,
      bio text,
      location text,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null,
      preferred_sports text[] default '{}',
      skill_levels jsonb default '{}'
    );
    
    -- Set up Row Level Security
    alter table public.profiles enable row level security;
    
    -- Create policies
    create policy "Users can view all profiles" 
    on public.profiles for select 
    using (true);
    
    create policy "Users can update their own profile" 
    on public.profiles for update 
    using (auth.uid() = id);
    
    -- Drop the existing insert policy
    drop policy if exists "Users can insert their own profile" on public.profiles;
    
    -- Create a new policy that works for both authenticated and service role inserts
    create policy "Allow profile creation" 
    on public.profiles for insert 
    with check (
      auth.uid() = id OR -- Allows authenticated users to create their own profile
      (auth.role() = 'service_role') -- Allows the service role to create profiles
    );
  `,
  
  GAMES: `
    create table if not exists public.games (
      id uuid default uuid_generate_v4() primary key,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null,
      title text not null,
      description text,
      sport text not null,
      skill_level text default 'all',
      host_id uuid references public.profiles(id) not null,
      court_id uuid references public.courts(id),
      date date not null,
      start_time time not null,
      end_time time not null,
      required_players integer not null,
      status text default 'open' check (status in ('open', 'full', 'in-progress', 'completed', 'cancelled')),
      location jsonb,
      equipment text,
      fee text default 'Free',
      weather_info text
    );
    
    -- Set up Row Level Security
    alter table public.games enable row level security;
    
    -- Create policies
    create policy "Games are viewable by everyone" 
    on public.games for select 
    using (true);
    
    create policy "Users can create games" 
    on public.games for insert 
    with check (auth.uid() = host_id);
    
    create policy "Hosts can update their games" 
    on public.games for update 
    using (auth.uid() = host_id);
    
    create policy "Hosts can delete their games" 
    on public.games for delete 
    using (auth.uid() = host_id);
  `,
  
  GAME_PARTICIPANTS: `
    create table if not exists public.game_participants (
      id uuid default uuid_generate_v4() primary key,
      created_at timestamp with time zone default now() not null,
      game_id uuid references public.games(id) not null,
      user_id uuid references public.profiles(id) not null,
      status text default 'joined' check (status in ('joined', 'left', 'removed')),
      unique(game_id, user_id)
    );
    
    -- Set up Row Level Security
    alter table public.game_participants enable row level security;
    
    -- Create policies
    create policy "Game participants are viewable by everyone" 
    on public.game_participants for select 
    using (true);
    
    create policy "Users can join games" 
    on public.game_participants for insert 
    with check (auth.uid() = user_id);
    
    create policy "Users can leave games" 
    on public.game_participants for update 
    using (auth.uid() = user_id);
    
    create policy "Game hosts can update participants' status"
    on public.game_participants for update
    using (
      auth.uid() in (
        select host_id from public.games
        where id = game_participants.game_id
      )
    );
  `,
  
  COURTS: `
    create table if not exists public.courts (
      id uuid default uuid_generate_v4() primary key,
      created_at timestamp with time zone default now() not null,
      name text not null,
      sport text not null,
      location jsonb not null,
      address text,
      capacity integer,
      indoor boolean default false,
      amenities text[]
    );
    
    -- Set up Row Level Security
    alter table public.courts enable row level security;
    
    -- Create policies
    create policy "Courts are viewable by everyone" 
    on public.courts for select 
    using (true);
    
    -- Only admins can create/edit courts in production
    create policy "Anyone can create courts during development" 
    on public.courts for insert 
    with check (true);
    
    create policy "Anyone can update courts during development" 
    on public.courts for update 
    using (true);
  `,
  
  DISCUSSIONS: `
    create table if not exists public.discussions (
      id uuid default uuid_generate_v4() primary key,
      created_at timestamp with time zone default now() not null,
      game_id uuid references public.games(id) not null,
      user_id uuid references public.profiles(id) not null,
      message text not null
    );
    
    -- Set up Row Level Security
    alter table public.discussions enable row level security;
    
    -- Create policies
    create policy "Discussions are viewable by everyone" 
    on public.discussions for select 
    using (true);
    
    create policy "Participants can post in discussions"
    on public.discussions for insert
    with check (
      -- Either the user is the host
      auth.uid() in (
        select host_id from public.games
        where id = discussions.game_id
      )
      -- Or the user is a participant
      OR
      auth.uid() in (
        select user_id from public.game_participants
        where game_id = discussions.game_id
        and status = 'joined'
      )
    );
    
    create policy "Users can delete their own messages"
    on public.discussions for delete
    using (auth.uid() = user_id);
  `
};

// Triggers for updating timestamps
export const SQL_TRIGGERS = `
  -- Function to update the updated_at timestamp
  create or replace function trigger_set_timestamp()
  returns trigger as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$ language plpgsql;

  -- Add triggers to tables
  create trigger set_timestamp_profiles
  before update on public.profiles
  for each row execute procedure trigger_set_timestamp();

  create trigger set_timestamp_games
  before update on public.games
  for each row execute procedure trigger_set_timestamp();
`;

// Insert sample data
export const SQL_SAMPLE_DATA = {
  COURTS: `
    insert into public.courts (name, sport, location, address, capacity, indoor, amenities)
    values 
    ('Main Basketball Court', 'basketball', '{"latitude": 37.7749, "longitude": -122.4194}', 'University Campus, Building 5', 20, false, '{"water fountains", "restrooms", "seating"}'),
    ('Indoor Sports Hall (Badminton)', 'badminton', '{"latitude": 37.7746, "longitude": -122.4189}', 'University Campus, Sports Complex', 16, true, '{"restrooms", "lockers", "showers"}'),
    ('University Field', 'football', '{"latitude": 37.7753, "longitude": -122.4199}', 'University Campus, North Field', 30, false, '{"restrooms", "water fountains", "lighting"}'),
    ('Recreation Center (Table Tennis)', 'table-tennis', '{"latitude": 37.7738, "longitude": -122.4188}', 'University Campus, Recreation Building', 16, true, '{"restrooms", "lockers", "cafe"}'),
    ('Beach Volleyball Court', 'volleyball', '{"latitude": 37.7736, "longitude": -122.4205}', 'University Beach', 12, false, '{"outdoor showers", "seating"}'),
    ('Second Basketball Court', 'basketball', '{"latitude": 37.7741, "longitude": -122.4197}', 'University Campus, South Building', 16, true, '{"water fountains", "restrooms"}')
  `
}; 