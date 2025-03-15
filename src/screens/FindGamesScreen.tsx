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

type FindGamesScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'FindGames'>;
type FindGamesNavigationProp = StackNavigationProp<AppStackParamList>;

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
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState(mockGames);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 37.7749, longitude: -122.4194 });

  // Get sport icon based on sport type
  const getSportIcon = (sportType: string) => {
    switch (sportType) {
      case 'basketball':
        return 'basketball';
      case 'football':
        return 'soccer';
      case 'badminton':
        return 'badminton';
      case 'table-tennis':
        return 'table-tennis';
      case 'volleyball':
        return 'volleyball';
      default:
        return 'sport';
    }
  };

  // Function to fetch games from the backend
  const fetchGames = async () => {
    try {
      setLoading(true);
      
      // Build filters object based on selections
      const filters = {};
      if (selectedSport) {
        filters.sport = selectedSport.toLowerCase();
      }
      if (selectedSkillLevel && selectedSkillLevel !== 'all') {
        filters.skillLevel = selectedSkillLevel.toLowerCase();
      }
      
      // Use our Supabase utility to get games
      const { games: fetchedGames, error } = await gameUtils.getGames(filters);
      
      if (error) {
        console.error('Error fetching games:', error);
        return;
      }
      
      // Calculate distance for each game if location data is available
      const gamesWithDistance = fetchedGames.map(game => {
        let distance = null;
        
        if (game.location && game.location.latitude && game.location.longitude) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            game.location.latitude,
            game.location.longitude
          );
        }
        
        // Format game for display
        return {
          ...game,
          distance,
          // Format participants count
          participantsCount: game.participants ? game.participants.length : 0,
        };
      });
      
      setGames(gamesWithDistance);
      filterGames(gamesWithDistance, searchQuery);
      
    } catch (error) {
      console.error('Error in fetchGames:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const filterGames = (gamesData, query) => {
    if (!gamesData) return;
    
    let filtered = [...gamesData];
    
    // Apply search query filter
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      filtered = filtered.filter(
        game => game.title.toLowerCase().includes(lowercasedQuery) || 
               (game.description && game.description.toLowerCase().includes(lowercasedQuery))
      );
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
  );

  const renderGameMarkers = () => {
    if (!filteredGames) return [];
    
    return filteredGames.map(game => {
      if (game.location && game.location.latitude && game.location.longitude) {
        return {
          id: game.id,
          latitude: game.location.latitude,
          longitude: game.location.longitude,
          title: game.title,
          description: `${game.sport} - ${game.skillLevel || 'All levels'}`
        };
      }
      return null;
    }).filter(marker => marker !== null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search games, locations..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={COLORS.primary}
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Sport</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {sportOptions.map(sport => (
            <Chip
              key={sport.id}
              selected={selectedSport === sport.id}
              onPress={() => toggleSportFilter(sport.id)}
              style={[
                styles.filterChip,
                selectedSport === sport.id && styles.selectedFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                selectedSport === sport.id && styles.selectedFilterChipText
              ]}
              icon={sport.icon}
            >
              {sport.name}
            </Chip>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Skill Level</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {skillLevelOptions.map(level => (
            <Chip
              key={level.id}
              selected={selectedSkillLevel === level.id}
              onPress={() => toggleSkillFilter(level.id)}
              style={[
                styles.filterChip,
                selectedSkillLevel === level.id && styles.selectedFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                selectedSkillLevel === level.id && styles.selectedFilterChipText
              ]}
            >
              {level.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.viewToggleContainer}>
        <Button 
          mode={showMap ? "outlined" : "contained"} 
          onPress={toggleMapView}
          style={styles.viewToggleButton}
        >
          List View
        </Button>
        <Button 
          mode={showMap ? "contained" : "outlined"} 
          onPress={toggleMapView}
          style={styles.viewToggleButton}
        >
          Map View
        </Button>
      </View>

      <Divider style={styles.divider} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : showMap ? (
        <View style={styles.mapContainer}>
          <SporteaMap
            style={styles.map}
            markers={renderGameMarkers()}
            onMarkerPress={(marker) => navigateToGameDetails(marker.id)}
          />
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          renderItem={renderGameItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gamesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No games found matching your criteria</Text>
              <Button mode="contained" onPress={onRefresh}>
                Refresh
              </Button>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  filterContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
  filterTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  filterScroll: {
    paddingBottom: SPACING.sm,
  },
  filterChip: {
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.text,
  },
  selectedFilterChipText: {
    color: COLORS.background,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  viewToggleButton: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  divider: {
    marginBottom: SPACING.md,
  },
  gamesList: {
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  distanceChip: {
    backgroundColor: COLORS.card,
    height: 24,
  },
  cardDetails: {
    marginTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    width: '35%',
    color: COLORS.text,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
  },
  mapContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  map: {
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.disabled,
  },
});

export default FindGamesScreen; 