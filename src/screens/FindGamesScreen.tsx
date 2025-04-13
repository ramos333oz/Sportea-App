import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { TABLES } from '../constants/database';

type Game = {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  location: string;
  start_time: string;
};

export default function FindGamesScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error.message);
      // Fallback to mock data if there's an error
      setGames([
        {
          id: '1',
          title: 'Sample Game',
          description: 'This is a sample game',
          sport_type: 'Basketball',
          location: 'Local Court',
          start_time: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderGame = ({ item }: { item: Game }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge">{item.title}</Text>
        <Text variant="bodyMedium">{item.description}</Text>
        <Text variant="bodyMedium">Sport: {item.sport_type}</Text>
        <Text variant="bodyMedium">Location: {item.location}</Text>
        <Text variant="bodyMedium">
          Time: {new Date(item.start_time).toLocaleString()}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => console.log('Join game:', item.id)}>
          Join Game
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  list: {
    gap: 10,
  },
  card: {
    marginBottom: 10,
  },
});