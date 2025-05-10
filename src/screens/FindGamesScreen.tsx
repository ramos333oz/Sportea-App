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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });
  const { user } = useAuth();

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

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleSportFilter = (sport: string) => {
    if (selectedSport === sport) {
      setSelectedSport('all');
    } else {
      setSelectedSport(sport);
    }
  };

  const toggleSkillFilter = (skill: string) => {
    if (selectedSkillLevel === skill) {
      setSelectedSkillLevel('all');
    } else {
      setSelectedSkillLevel(skill);
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };

  // Get sport icon
  const getSportIcon = (sport: string) => {
    const sportOption = sportOptions.find(option => option.id === sport);
    return sportOption ? sportOption.icon : 'handball';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Navigate to game details
  const navigateToGameDetails = (gameId: string) => {
    navigation.navigate('GameDetails' as never, { gameId } as never);
  };

  // Render game item
  const renderGameItem = ({ item }: { item: DisplayGame }) => (
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
            <Chip style={styles.distanceChip}>{item.distance ? `${item.distance.toFixed(1)} miles` : 'Unknown'}</Chip>
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

  // Render filters
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Searchbar
        placeholder="Search games"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Sport:</Text>
          <View style={styles.chipsContainer}>
            {sportOptions.map(sport => (
              <Chip
                key={sport.id}
                selected={selectedSport === sport.id}
                onPress={() => toggleSportFilter(sport.id)}
                style={[
                  styles.filterChip,
                  selectedSport === sport.id && styles.selectedChip
                ]}
                icon={sport.icon}
              >
                {sport.name}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Skill Level:</Text>
          <View style={styles.chipsContainer}>
            {skillLevelOptions.map(skill => (
              <Chip
                key={skill.id}
                selected={selectedSkillLevel === skill.id}
                onPress={() => toggleSkillFilter(skill.id)}
                style={[
                  styles.filterChip,
                  selectedSkillLevel === skill.id && styles.selectedChip
                ]}
              >
                {skill.name}
              </Chip>
            ))}
          </View>
        </View>
      </ScrollView>

      <Button
        mode="outlined"
        onPress={toggleMapView}
        style={styles.mapToggleButton}
        icon={showMap ? 'format-list-bulleted' : 'map'}
      >
        {showMap ? 'Show List' : 'Show Map'}
      </Button>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="basketball" size={64} color={COLORS.disabled} />
      <Text style={styles.emptyText}>No games found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your filters or search query</Text>
      <Button
        mode="contained"
        onPress={() => {
          setSelectedSport('all');
          setSelectedSkillLevel('all');
          setSearchQuery('');
        }}
        style={styles.resetButton}
      >
        Reset Filters
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderFilters()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : (
        showMap ? (
          <SporteaMap games={filteredGames} onGamePress={navigateToGameDetails} />
        ) : (
          <FlatList
            data={filteredGames}
            renderItem={renderGameItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filtersContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  filterSection: {
    marginRight: SPACING.xl,
  },
  filterTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    margin: 2,
    backgroundColor: COLORS.background,
  },
  selectedChip: {
    backgroundColor: COLORS.primary + '20',
  },
  mapToggleButton: {
    marginTop: SPACING.xs,
    borderColor: COLORS.primary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  distanceChip: {
    backgroundColor: COLORS.primary + '20',
    height: 24,
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  cardDetails: {
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    width: 100,
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  detailValue: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  joinButton: {
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
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
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
  },
});

export default FindGamesScreen;