-- Function to delete a game and all its related participants in a single transaction
CREATE OR REPLACE FUNCTION public.delete_game_and_participants(game_id_param UUID)
RETURNS boolean AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Start a transaction to ensure all operations complete or none do
  BEGIN
    -- First delete all participants for the given game
    DELETE FROM public.game_participants
    WHERE game_id = game_id_param;
    
    -- Then delete the game itself
    DELETE FROM public.games
    WHERE id = game_id_param;
    
    success := true;
    RETURN success;
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, the transaction will be rolled back
    RAISE NOTICE 'Error deleting game: %', SQLERRM;
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql;
