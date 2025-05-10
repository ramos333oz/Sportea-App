import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, Avatar, Divider, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/MainNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import SporteaMap from '../components/MapView';
import { gameUtils } from '../utils/supabaseUtils';
import { calculateDistance } from '../utils/mapUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { TABLES } from '../constants/database';
import { Game } from '../types/database';

type FindGamesScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'FindGames'>;
type FindGamesNavigationProp = StackNavigationProp<AppStackParamList>;

interface DisplayGame extends Partial<Game> {
  id: string;
  title: string;
  date: string;
  location: string;
  participants: number;
  totalSpots: number;
  sport: string;
  host: string;
  distance: number | null;
  skillLevel: string;
}

// Mock data for games
const mockGames = [
  {
    id: '1',
    title: 'Basketball 3v3 Tournament',
    date: '2023-06-15T16:30:00',
    location: 'Main Basketball Court',
    participants: 8,
    totalSpots: 12,
    sport: 'basketball',
    host: 'Michael J.',
    distance: 0.8,
    skillLevel: 'intermediate'
  },
  {
    id: '2',
    title: 'Football Friendly Match',
    date: '2023-06-16T18:00:00',
    location: 'University Field',
    participants: 16,
    totalSpots: 22,
    sport: 'football',
    host: 'David B.',
    distance: 1.2,
    skillLevel: 'all'
  },
  {
    id: '3',
    title: 'Badminton Singles',
    date: '2023-06-17T14:00:00',
    location: 'Indoor Sports Hall',
    participants: 6,
    totalSpots: 8,
    sport: 'badminton',
    host: 'Sarah L.',
    distance: 0.5,
    skillLevel: 'advanced'
  },
  {
    id: '4',
    title: 'Table Tennis Tournament',
    date: '2023-06-18T15:30:00',
    location: 'Recreation Center',
    participants: 8,
    totalSpots: 16,
    sport: 'table-tennis',
    host: 'Kevin T.',
    distance: 1.5,
    skillLevel: 'beginner'
  },
  {
    id: '5',
    title: 'Volleyball Beach Match',
    date: '2023-06-19T11:00:00',
    location: 'University Beach',
    participants: 8,
    totalSpots: 12,
    sport: 'volleyball',
    host: 'Emma S.',
    distance: 2.3,
    skillLevel: 'all'
  }
];

// Sport options for filtering
const sportOptions = [
  { id: 'all', name: 'All Sports', icon: 'handball' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'football', name: 'Football', icon: 'soccer' },
  { id: 'badminton', name: 'Badminton', icon: 'badminton' },
  { id: 'table-tennis', name: 'Table Tennis', icon: 'table-tennis' },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball' },
];

// Skill level options for filtering
const skillLevelOptions = [
  { id: 'all', name: 'All Levels' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

const FindGamesScreen = () => {
  const navigation = useNavigation<FindGamesScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState('all');
  const [showMap, setShowMap] = useState(false);
  const [games, setGames] = useState<DisplayGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<DisplayGame[]>(mockGames);
  
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

      setLoading(true);
      
      const filters = {
        sport: selectedSport !== 'all' ? selectedSport : undefined,
        skillLevel: selectedSkillLevel !== 'all' ? selectedSkillLevel : undefined
      };
      
      const { games: fetchedGames, error } = await gameUtils.getGames(filters);
      
      if (error) {
        console.error('Error fetching games:', error);
        setGames(mockGames);
        setFilteredGames(mockGames);
        return;
      }
      
      if (fetchedGames && fetchedGames.length > 0) {
      const gamesWithDistance = fetchedGames.map(game => {
        let distance = null;
        
          if (game.location_lat && game.location_lng) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
              game.location_lat,
              game.location_lng
          );
        }
        
        return {
          ...game,
          distance,
            participants: game.participants?.length || 0,
            totalSpots: game.max_participants,
            sport: game.sport_type,
            host: game.host?.username || 'Unknown Host',
            skillLevel: game.skill_level
          } as DisplayGame;
      });
      
      setGames(gamesWithDistance);
      filterGames(gamesWithDistance, searchQuery);
      } else {
        setGames(mockGames);
        setFilteredGames(mockGames);
      }
      
    } catch (error) {
      console.error('Error in fetchGames:', error);
      setGames(mockGames);
      setFilteredGames(mockGames);

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


  // Initial fetch
  useEffect(() => {
    fetchGames();
  }, []);

  // Filter when selections change
  useEffect(() => {
    filterGames(games, searchQuery);
  }, [selectedSport, selectedSkillLevel, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  const filterGames = (gamesData: DisplayGame[], query: string) => {
    let filtered = [...gamesData];
    
    // Apply search query filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(game => 
        game.title.toLowerCase().includes(lowercaseQuery) ||
        game.location.toLowerCase().includes(lowercaseQuery) ||
        game.host.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    // Apply sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(game => game.sport === selectedSport);
    }
    
    // Apply skill level filter
    if (selectedSkillLevel !== 'all') {
      filtered = filtered.filter(game => game.skillLevel === selectedSkillLevel);
    }
    
    setFilteredGames(filtered);
  };

  const onChangeSearch = query => {
    setSearchQuery(query);
  };

  const toggleSportFilter = sport => {
    if (selectedSport === sport) {
      setSelectedSport('');
    } else {
      setSelectedSport(sport);
    }
  };

  const toggleSkillFilter = skill => {
    if (selectedSkillLevel === skill) {
      setSelectedSkillLevel('');
    } else {
      setSelectedSkillLevel(skill);
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Navigate to game details
  const navigateToGameDetails = (gameId) => {
    navigation.navigate('GameDetails', { gameId });
  };

  // Render game item
  const renderGameItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToGameDetails(item.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Avatar.Icon 
              size={40} 
              icon={getSportIcon(item.sport)} 
              style={{ backgroundColor: COLORS.primary }} 
            />
            <View style={styles.titleContainer}>
              <Title style={styles.cardTitle}>{item.title}</Title>
              <Text style={styles.cardSubtitle}>{formatDate(item.date)}</Text>
            </View>
            <Chip style={styles.distanceChip}>{item.distance} miles away</Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{item.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Host:</Text>
              <Text style={styles.detailValue}>{item.host}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Skill Level:</Text>
              <Text style={styles.detailValue}>{item.skillLevel === 'all' ? 'All levels' : 
                item.skillLevel.charAt(0).toUpperCase() + item.skillLevel.slice(1)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Participants:</Text>
              <Text style={styles.detailValue}>
                {item.participants}/{item.totalSpots}
              </Text>
            </View>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="contained" 
            style={styles.joinButton}
          >
            View Details
          </Button>
        </Card.Actions>
      </Card>
    </TouchableOpacity>

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