-- Function to delete all participants for a game
CREATE OR REPLACE FUNCTION public.delete_game_participants(game_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Delete all participants for the given game
  DELETE FROM public.game_participants
  WHERE game_id = game_id_param;
END;
$$ LANGUAGE plpgsql;
