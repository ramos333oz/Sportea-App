-- Function to delete a game and all its related records with CASCADE option
CREATE OR REPLACE FUNCTION public.delete_game_with_participants(game_id_param UUID)
RETURNS void AS $$
BEGIN
  -- First delete all participants for the given game
  DELETE FROM public.game_participants
  WHERE game_id = game_id_param;
  
  -- Delete from matchmaking_queue if any references exist
  DELETE FROM public.matchmaking_queue
  WHERE game_id = game_id_param;
  
  -- Delete from matches if any references exist
  DELETE FROM public.matches
  WHERE game_id = game_id_param;
  
  -- Finally delete the game itself
  DELETE FROM public.games
  WHERE id = game_id_param;
END;
$$ LANGUAGE plpgsql;
