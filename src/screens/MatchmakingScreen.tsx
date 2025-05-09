import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Animated, Dimensions, RefreshControl } from 'react-native';
import { Text, Button, Card, Avatar, Chip, ProgressBar, Title, Paragraph, ActivityIndicator, IconButton, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import matchmakingService from '../services/matchmakingService';
import MultiSelect from 'react-native-multiple-select';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MatchmakingScreenNavigationProp = StackNavigationProp<AppStackParamList>;

// Sport options for preferences
const sportOptions = [
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'football', name: 'Football', icon: 'soccer' },
  { id: 'badminton', name: 'Badminton', icon: 'badminton' },
  { id: 'table-tennis', name: 'Table Tennis', icon: 'table-tennis' },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball' },
  { id: 'tennis', name: 'Tennis', icon: 'tennis' },
  { id: 'swimming', name: 'Swimming', icon: 'swim' },
  { id: 'running', name: 'Running', icon: 'run' },
];

// Skill level options
const skillLevelOptions = [
  { id: 'all', name: 'All Levels' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

const MatchmakingScreen = () => {
  const navigation = useNavigation<MatchmakingScreenNavigationProp>();
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [preferences, setPreferences] = useState({
    sports: [] as string[],
    skillLevel: 'all',
    maxDistance: 10,
    lookingForGame: true,
  });
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const searchTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get('window').width;

  // Start pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Initialize matchmaking service
  useEffect(() => {
    const initialize = async () => {
      if (user) {
        try {
          setConnectionStatus('connecting');
          
          // Get user profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          setUserProfile(data);
          
          // Set initial preferences from user profile
          setPreferences(prev => ({
            ...prev,
            sports: data.preferred_sports || [],
          }));
          
          // Initialize matchmaking service
          const initialized = await matchmakingService.initialize(user.id);
          if (!initialized) {
            Alert.alert('Error', 'Failed to initialize matchmaking service');
            setConnectionStatus('error');
            return;
          }
          
          // Register match callback
          matchmakingService.onMatch(handleMatchUpdate);
          
          // Register game update callback
          matchmakingService.onGameUpdate(handleGameUpdate);
          
          // Register queue update callback
          matchmakingService.onQueueUpdate(handleQueueUpdate);
          
          // Fetch available games
          fetchAvailableGames();
          
          setConnectionStatus('connected');
        } catch (error) {
          console.error('Error initializing matchmaking:', error);
          Alert.alert('Error', 'Failed to load user profile');
          setConnectionStatus('error');
        } finally {
          setIsInitializing(false);
        }
      }
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (searchTimeInterval.current) {
        clearInterval(searchTimeInterval.current);
      }
      
      // Unregister all callbacks
      matchmakingService.offMatch(handleMatchUpdate);
      matchmakingService.offGameUpdate(handleGameUpdate);
      matchmakingService.offQueueUpdate(handleQueueUpdate);
      
      // Stop matchmaking
      matchmakingService.stopMatchmaking();
    };
  }, [user]);

  // Start pulse animation when searching
  useEffect(() => {
    if (isSearching) {
      startPulseAnimation();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isSearching]);

  // Handle match update from service
  const handleMatchUpdate = (matchData: any) => {
    console.log('Match update received:', matchData);
    setCurrentMatch(matchData);
    setIsSearching(false);
    if (searchTimeInterval.current) {
      clearInterval(searchTimeInterval.current);
    }
  };
  
  // Handle game update from service
  const handleGameUpdate = (gameData: any) => {
    console.log('Game update received:', gameData);
    
    // Update available games list
    fetchAvailableGames();
  };
  
  // Handle queue update from service
  const handleQueueUpdate = (queueData: any) => {
    console.log('Queue update received:', queueData);
    
    // If status changed to inactive, stop searching
    if (queueData?.status === 'inactive' && isSearching) {
      setIsSearching(false);
      if (searchTimeInterval.current) {
        clearInterval(searchTimeInterval.current);
      }
    }
  };
  
  // Fetch available games
  const fetchAvailableGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          participants:game_participants(*)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setAvailableGames(data || []);
    } catch (error) {
      console.error('Error fetching available games:', error);
    }
  };

  // Toggle matchmaking
  const toggleMatchmaking = async () => {
    if (isSearching) {
      // Stop matchmaking
      await matchmakingService.stopMatchmaking();
      setIsSearching(false);
      setPotentialMatches([]);
      if (searchTimeInterval.current) {
        clearInterval(searchTimeInterval.current);
      }
    } else {
      // Start matchmaking
      const success = await matchmakingService.startMatchmaking(preferences);
      if (success) {
        setIsSearching(true);
        setSearchTime(0);
        searchTimeInterval.current = setInterval(() => {
          setSearchTime(prev => prev + 1);
        }, 1000);
        
        // Periodically check for matches
        checkForMatches();
      } else {
        Alert.alert('Error', 'Failed to start matchmaking');
      }
    }
  };

  // Check for potential matches
  const checkForMatches = async () => {
    try {
      const { success, matches, error } = await matchmakingService.findPotentialMatches();
      if (success && matches) {
        setPotentialMatches(matches);
      } else if (error) {
        console.error('Error finding matches:', error);
      }
    } catch (error) {
      console.error('Error checking for matches:', error);
    }
  };

  // Accept a match
  const acceptMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'accepted' })
        .eq('id', matchId);
        
      if (error) throw error;
      
      Alert.alert('Success', 'Match accepted! You can now chat with this player.');
      setCurrentMatch(null);
      navigation.navigate('Chat', { matchId });
    } catch (error) {
      console.error('Error accepting match:', error);
      Alert.alert('Error', 'Failed to accept match');
    }
  };

  // Decline a match
  const declineMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'declined' })
        .eq('id', matchId);
        
      if (error) throw error;
      
      setCurrentMatch(null);
    } catch (error) {
      console.error('Error declining match:', error);
      Alert.alert('Error', 'Failed to decline match');
    }
  };
  
  // Join a game
  const joinGame = async (gameId: string) => {
    try {
      const result: { success: boolean; error?: any; message?: string } = await matchmakingService.joinGame(gameId);
      
      if (result.success) {
        Alert.alert('Success', 'You have joined the game!');
        fetchAvailableGames();
        
        // Navigate to game details
        navigation.navigate('GameDetails', { gameId });
      } else {
        Alert.alert('Error', result.error?.toString() || 'Failed to join the game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      Alert.alert('Error', 'Failed to join the game');
    }
  };

  // Handle preference change
  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Format search time
  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render connection status
  const renderConnectionStatus = () => {
    let color = COLORS.disabled;
    let text = 'Connecting...';
    
    switch (connectionStatus) {
      case 'connected':
        color = COLORS.success;
        text = 'Connected';
        break;
      case 'error':
        color = COLORS.error;
        text = 'Connection Error';
        break;
      default:
        color = COLORS.warning;
        text = 'Connecting...';
    }
    
    return (
      <View style={styles.connectionStatus}>
        <View style={[styles.statusIndicator, { backgroundColor: color }]} />
        <Text style={styles.statusText}>{text}</Text>
      </View>
    );
  };

  // Render match request
  const renderMatchRequest = () => {
    if (!currentMatch) return null;
    
    return (
      <Card style={styles.matchRequestCard}>
        <Card.Title title="Match Request" />
        <Card.Content>
          <Text style={styles.matchText}>
            A player wants to match with you for {currentMatch.sport || 'a game'}!
          </Text>
          <View style={styles.matchActions}>
            <Button
              mode="contained"
              style={[styles.matchButton, { backgroundColor: COLORS.success }]}
              onPress={() => acceptMatch(currentMatch.id)}
            >
              Accept
            </Button>
            <Button
              mode="outlined"
              style={styles.matchButton}
              onPress={() => declineMatch(currentMatch.id)}
            >
              Decline
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Render available games
  const renderAvailableGames = () => {
    if (availableGames.length === 0) {
      return (
        <Card style={styles.noGamesCard}>
          <Card.Content>
            <Text style={styles.noGamesText}>No games available at the moment</Text>
            <Text style={styles.noGamesSubtext}>Try creating a new game or adjusting your preferences</Text>
          </Card.Content>
        </Card>
      );
    }
    
    return availableGames.map(game => {
      const participantsCount = game.participants?.length || 0;
      const spotsLeft = game.required_players - participantsCount;
      const isUserParticipant = game.participants?.some((p: any) => p.user_id === user?.id) || false;
      const isUserHost = game.host_id === user?.id;
      
      return (
        <Card key={game.id} style={styles.gameCard}>
          <Card.Title
            title={game.title}
            subtitle={`${game.sport} • ${game.skill_level || 'All levels'}`}
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon={getSportIcon(game.sport)}
                style={{ backgroundColor: COLORS.primary }}
              />
            )}
          />
          <Card.Content>
            <View style={styles.gameDetails}>
              <View style={styles.gameDetail}>
                <MaterialCommunityIcons name="calendar" size={16} color={COLORS.text} />
                <Text style={styles.gameDetailText}>
                  {new Date(game.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.gameDetail}>
                <MaterialCommunityIcons name="account-group" size={16} color={COLORS.text} />
                <Text style={styles.gameDetailText}>
                  {participantsCount}/{game.required_players} players
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('GameDetails', { gameId: game.id })}
            >
              Details
            </Button>
            {!isUserParticipant && !isUserHost && (
              <Button
                mode="contained"
                onPress={() => joinGame(game.id)}
                disabled={spotsLeft <= 0}
              >
                {spotsLeft <= 0 ? 'Full' : 'Join'}
              </Button>
            )}
            {(isUserParticipant || isUserHost) && (
              <Chip mode="outlined" style={{ backgroundColor: COLORS.success, marginLeft: SPACING.sm }}>
                {isUserHost ? 'Hosting' : 'Joined'}
              </Chip>
            )}
          </Card.Actions>
        </Card>
      );
    });
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing matchmaking...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderConnectionStatus()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchAvailableGames}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Match Request */}
        {renderMatchRequest()}
        
        {/* Matchmaking Section */}
        <Card style={styles.matchmakingCard}>
          <Card.Title title="Find Players" />
          <Card.Content>
            <View style={styles.preferencesContainer}>
              <Text style={styles.preferencesTitle}>Your Preferences</Text>
              
              {/* Sports Selection */}
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Sports</Text>
                <MultiSelect
                  items={sportOptions}
                  uniqueKey="id"
                  displayKey="name"
                  selectedItems={preferences.sports}
                  onSelectedItemsChange={(items: string[]) => handlePreferenceChange('sports', items)}
                  selectText="Select Sports"
                  searchInputPlaceholderText="Search Sports..."
                  tagRemoveIconColor={COLORS.error}
                  tagBorderColor={COLORS.primary}
                  tagTextColor={COLORS.text}
                  selectedItemTextColor={COLORS.primary}
                  selectedItemIconColor={COLORS.primary}
                  itemTextColor={COLORS.text}
                  styleMainWrapper={styles.multiSelectWrapper}
                  styleDropdownMenuSubsection={styles.multiSelectDropdown}
                  hideSubmitButton
                />
              </View>
              
              {/* Skill Level Selection */}
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Skill Level</Text>
                <View style={styles.skillLevelContainer}>
                  {skillLevelOptions.map(level => (
                    <Chip
                      key={level.id}
                      selected={preferences.skillLevel === level.id}
                      onPress={() => handlePreferenceChange('skillLevel', level.id)}
                      style={[
                        styles.skillChip,
                        preferences.skillLevel === level.id && styles.selectedSkillChip
                      ]}
                    >
                      {level.name}
                    </Chip>
                  ))}
                </View>
              </View>
              
              {/* Distance Slider */}
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>
                  Maximum Distance: {preferences.maxDistance} km
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={preferences.maxDistance}
                  onValueChange={(value) => handlePreferenceChange('maxDistance', value)}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.disabled}
                  thumbTintColor={COLORS.primary}
                />
              </View>
            </View>
            
            <Button
              mode="contained"
              style={styles.matchmakingButton}
              loading={isSearching}
              icon={isSearching ? 'stop' : 'account-search'}
              onPress={toggleMatchmaking}
            >
              {isSearching ? 'Stop Searching' : 'Start Matchmaking'}
            </Button>
            
            {isSearching && (
              <View style={styles.searchingContainer}>
                <Text style={styles.searchingText}>
                  Searching for players... {formatSearchTime(searchTime)}
                </Text>
                <ProgressBar
                  indeterminate
                  style={styles.searchingProgress}
                  color={COLORS.primary}
                />
                
                <Animated.View
                  style={[
                    styles.radarContainer,
                    {
                      transform: [
                        { scale: pulseAnim }
                      ]
                    }
                  ]}
                >
                  <View style={styles.radarCircle} />
                  <View style={styles.radarCenter} />
                </Animated.View>
                
                {potentialMatches.length > 0 && (
                  <View style={styles.potentialMatchesContainer}>
                    <Text style={styles.potentialMatchesTitle}>
                      Potential Matches ({potentialMatches.length})
                    </Text>
                    {potentialMatches.slice(0, 3).map((match, index) => (
                      <View key={index} style={styles.potentialMatchItem}>
                        <Avatar.Text
                          size={40}
                          label={match.username?.charAt(0) || 'U'}
                          style={{ backgroundColor: COLORS.secondary }}
                        />
                        <View style={styles.potentialMatchInfo}>
                          <Text style={styles.potentialMatchName}>
                            {match.username || 'Unknown Player'}
                          </Text>
                          <Text style={styles.potentialMatchDetails}>
                            {match.sport || 'Any sport'} • {match.distance?.toFixed(1) || '?'} km away
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Available Games Section */}
        <View style={styles.gamesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Games</Text>
            <Button
              mode="text"
              onPress={fetchAvailableGames}
              icon="refresh"
              compact
            >
              Refresh
            </Button>
          </View>
          
          {renderAvailableGames()}
        </View>
      </ScrollView>
    </View>
  );
};

// Helper function to get sport icon
const getSportIcon = (sport: string) => {
  switch (sport?.toLowerCase()) {
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
    case 'tennis':
      return 'tennis';
    case 'swimming':
      return 'swim';
    case 'running':
      return 'run';
    default:
      return 'basketball';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  matchRequestCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
  },
  matchText: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  matchButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  matchmakingCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
  },
  preferencesContainer: {
    marginBottom: SPACING.md,
  },
  preferencesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  preferenceItem: {
    marginBottom: SPACING.md,
  },
  preferenceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  multiSelectWrapper: {
    backgroundColor: COLORS.background,
  },
  multiSelectDropdown: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    margin: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  selectedSkillChip: {
    backgroundColor: COLORS.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  matchmakingButton: {
    backgroundColor: COLORS.primary,
  },
  searchingContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  searchingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  searchingProgress: {
    width: '100%',
    height: 4,
    marginBottom: SPACING.md,
  },
  radarContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  radarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.5,
  },
  radarCenter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  potentialMatchesContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  potentialMatchesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  potentialMatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  potentialMatchInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  potentialMatchName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  potentialMatchDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  gamesSection: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  gameCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
  },
  gameDetails: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  gameDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  gameDetailText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  noGamesCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
  },
  noGamesText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  noGamesSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    textAlign: 'center',
  },
});

export default MatchmakingScreen;
