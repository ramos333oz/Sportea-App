-- Create matchmaking queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  location JSONB,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'searching', 'matched')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  device_info JSONB
);

-- Set up Row Level Security
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own matchmaking status" 
ON public.matchmaking_queue FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own matchmaking status" 
ON public.matchmaking_queue FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matchmaking status" 
ON public.matchmaking_queue FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  matched_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  game_id UUID REFERENCES public.games(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  match_type TEXT NOT NULL DEFAULT 'player' CHECK (match_type IN ('player', 'game')),
  compatibility_score NUMERIC(3,2),
  message TEXT,
  UNIQUE(user_id, matched_user_id)
);

-- Set up Row Level Security
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own matches" 
ON public.matches FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can update their own matches" 
ON public.matches FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Function to find potential matches based on preferences and location
CREATE OR REPLACE FUNCTION public.find_potential_matches(
  p_user_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_max_distance NUMERIC DEFAULT 10,
  p_sports TEXT[] DEFAULT NULL,
  p_skill_level TEXT DEFAULT 'all'
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferred_sports TEXT[],
  skill_levels JSONB,
  distance NUMERIC,
  compatibility_score NUMERIC
) AS $$
DECLARE
  v_user_sports TEXT[];
  v_user_skill_levels JSONB;
BEGIN
  -- Get the user's sports and skill levels if not provided
  IF p_sports IS NULL THEN
    SELECT preferred_sports, skill_levels INTO v_user_sports, v_user_skill_levels
    FROM profiles
    WHERE id = p_user_id;
  ELSE
    v_user_sports := p_sports;
    
    SELECT skill_levels INTO v_user_skill_levels
    FROM profiles
    WHERE id = p_user_id;
  END IF;
  
  -- Find potential matches
  RETURN QUERY
  WITH active_users AS (
    SELECT 
      q.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.preferred_sports,
      p.skill_levels,
      q.location,
      q.preferences
    FROM matchmaking_queue q
    JOIN profiles p ON q.user_id = p.id
    WHERE 
      q.status = 'searching' 
      AND q.user_id != p_user_id
      AND q.last_updated > (now() - interval '1 hour')
  ),
  
  -- Calculate distance between users
  users_with_distance AS (
    SELECT
      u.*,
      CASE 
        WHEN u.location IS NOT NULL THEN
          6371 * acos(
            cos(radians(p_latitude)) * 
            cos(radians((u.location->>'latitude')::NUMERIC)) * 
            cos(radians((u.location->>'longitude')::NUMERIC) - radians(p_longitude)) + 
            sin(radians(p_latitude)) * 
            sin(radians((u.location->>'latitude')::NUMERIC))
          )
        ELSE NULL
      END AS distance
    FROM active_users u
  ),
  
  -- Filter by distance and calculate compatibility score
  matches_with_score AS (
    SELECT
      u.user_id,
      u.username,
      u.full_name,
      u.avatar_url,
      u.preferred_sports,
      u.skill_levels,
      u.distance,
      -- Calculate compatibility score (0-1)
      CASE
        WHEN u.preferred_sports IS NULL OR array_length(u.preferred_sports, 1) = 0 THEN 0
        ELSE (
          -- Sport match score (0.5 weight)
          0.5 * (
            CASE 
              WHEN v_user_sports IS NULL OR array_length(v_user_sports, 1) = 0 THEN 0
              ELSE (
                SELECT count(*) FROM (
                  SELECT unnest(v_user_sports) INTERSECT SELECT unnest(u.preferred_sports)
                ) as common_sports
              )::NUMERIC / 
              GREATEST(array_length(v_user_sports, 1), array_length(u.preferred_sports, 1))
            END
          ) +
          -- Skill level match score (0.3 weight)
          0.3 * (
            CASE
              WHEN v_user_skill_levels IS NULL OR u.skill_levels IS NULL THEN 0
              ELSE (
                SELECT avg(1 - abs(a.value::NUMERIC - b.value::NUMERIC) / 5)
                FROM jsonb_each_text(v_user_skill_levels) a
                JOIN jsonb_each_text(u.skill_levels) b ON a.key = b.key
                WHERE a.key = ANY(v_user_sports)
              )
            END
          ) +
          -- Distance score (0.2 weight)
          0.2 * (
            CASE
              WHEN u.distance IS NULL THEN 0
              ELSE GREATEST(0, 1 - (u.distance / p_max_distance))
            END
          )
        )
      END AS compatibility_score
    FROM users_with_distance u
    WHERE
      -- Filter by distance if location is available
      (u.distance IS NULL OR u.distance <= p_max_distance)
      -- Filter by sports if specified
      AND (
        v_user_sports IS NULL 
        OR array_length(v_user_sports, 1) = 0
        OR EXISTS (
          SELECT 1 
          FROM unnest(v_user_sports) s
          WHERE s = ANY(u.preferred_sports)
        )
      )
      -- Filter by skill level if specified
      AND (
        p_skill_level = 'all'
        OR NOT EXISTS (
          SELECT 1
          FROM jsonb_each_text(u.skill_levels) s
          WHERE s.key = ANY(v_user_sports) AND (
            (p_skill_level = 'beginner' AND s.value::NUMERIC > 2) OR
            (p_skill_level = 'intermediate' AND (s.value::NUMERIC < 2 OR s.value::NUMERIC > 4)) OR
            (p_skill_level = 'advanced' AND s.value::NUMERIC < 4)
          )
        )
      )
      -- Exclude users already matched with
      AND NOT EXISTS (
        SELECT 1 FROM matches m
        WHERE 
          (m.user_id = p_user_id AND m.matched_user_id = u.user_id)
          OR (m.user_id = u.user_id AND m.matched_user_id = p_user_id)
      )
  )
  
  -- Return the top matches
  SELECT 
    user_id,
    username,
    full_name,
    avatar_url,
    preferred_sports,
    skill_levels,
    distance,
    compatibility_score
  FROM matches_with_score
  WHERE compatibility_score > 0.3
  ORDER BY compatibility_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a match between two users
CREATE OR REPLACE FUNCTION public.create_match(
  p_user_id UUID,
  p_matched_user_id UUID,
  p_game_id UUID DEFAULT NULL,
  p_match_type TEXT DEFAULT 'player',
  p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_match_id UUID;
  v_compatibility NUMERIC;
BEGIN
  -- Calculate compatibility score if not for a specific game
  IF p_match_type = 'player' THEN
    WITH user_data AS (
      SELECT 
        p1.preferred_sports AS user_sports,
        p1.skill_levels AS user_skills,
        p2.preferred_sports AS matched_sports,
        p2.skill_levels AS matched_skills
      FROM profiles p1, profiles p2
      WHERE p1.id = p_user_id AND p2.id = p_matched_user_id
    ),
    sport_match AS (
      SELECT 
        CASE 
          WHEN array_length(user_sports, 1) = 0 OR array_length(matched_sports, 1) = 0 THEN 0
          ELSE (
            SELECT count(*) FROM (
              SELECT unnest(user_sports) INTERSECT SELECT unnest(matched_sports)
            ) as common_sports
          )::NUMERIC / 
          GREATEST(array_length(user_sports, 1), array_length(matched_sports, 1))
        END AS score
      FROM user_data
    ),
    skill_match AS (
      SELECT
        CASE
          WHEN user_skills IS NULL OR matched_skills IS NULL THEN 0
          ELSE (
            SELECT avg(1 - abs(a.value::NUMERIC - b.value::NUMERIC) / 5)
            FROM jsonb_each_text(user_skills) a
            JOIN jsonb_each_text(matched_skills) b ON a.key = b.key
          )
        END AS score
      FROM user_data
    )
    SELECT 
      0.7 * sport_match.score + 0.3 * skill_match.score INTO v_compatibility
    FROM sport_match, skill_match;
  ELSE
    v_compatibility := 1.0;
  END IF;
  
  -- Insert the match
  INSERT INTO public.matches (
    user_id,
    matched_user_id,
    game_id,
    status,
    match_type,
    compatibility_score,
    message
  ) VALUES (
    p_user_id,
    p_matched_user_id,
    p_game_id,
    'pending',
    p_match_type,
    v_compatibility,
    p_message
  ) RETURNING id INTO v_match_id;
  
  -- Update matchmaking queue status
  UPDATE public.matchmaking_queue
  SET status = 'matched'
  WHERE user_id = p_user_id;
  
  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matches_timestamp
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE PROCEDURE public.update_modified_column();
