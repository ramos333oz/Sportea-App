-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  attachment_url TEXT
);

-- Set up Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages for their matches" 
ON public.chat_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages for their matches" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
  )
);

CREATE POLICY "Users can update read status of their messages" 
ON public.chat_messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS chat_messages_match_id_idx ON public.chat_messages(match_id);
CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON public.chat_messages(sender_id);

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS TABLE (
  match_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.match_id,
    COUNT(cm.id) AS unread_count
  FROM 
    chat_messages cm
  JOIN 
    matches m ON cm.match_id = m.id
  WHERE 
    (m.user_id = p_user_id OR m.matched_user_id = p_user_id)
    AND cm.sender_id != p_user_id
    AND cm.read = FALSE
  GROUP BY 
    cm.match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in a match as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_match_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_messages
  SET read = TRUE
  WHERE 
    match_id = p_match_id
    AND sender_id != p_user_id
    AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
