-- Add DELETE policy to matches table
CREATE POLICY "Users can delete their own matches" 
ON public.matches FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Function to delete a match and its related chat messages
CREATE OR REPLACE FUNCTION public.delete_match_with_messages(match_id_param UUID)
RETURNS boolean AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Start a transaction to ensure all operations complete or none do
  BEGIN
    -- First delete all chat messages for the given match
    DELETE FROM public.chat_messages
    WHERE match_id = match_id_param;
    
    -- Then delete the match itself
    DELETE FROM public.matches
    WHERE id = match_id_param;
    
    success := true;
    RETURN success;
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, the transaction will be rolled back
    RAISE NOTICE 'Error deleting match: %', SQLERRM;
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql;
