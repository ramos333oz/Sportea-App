import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Animated, Dimensions } from 'react-native';
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchTime, setSearchTime] = useState(0);
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
          }
          
          // Register match callback
          matchmakingService.onMatch(handleMatchUpdate);
        } catch (error) {
          console.error('Error initializing matchmaking:', error);
          Alert.alert('Error', 'Failed to load user profile');
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
      matchmakingService.offMatch(handleMatchUpdate);
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

  // Reject a match
  const rejectMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'rejected' })
        .eq('id', matchId);
        
      if (error) throw error;
      
      setCurrentMatch(null);
      // Restart matchmaking
      toggleMatchmaking();
    } catch (error) {
      console.error('Error rejecting match:', error);
      Alert.alert('Error', 'Failed to reject match');
    }
  };

  // Format search time
  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render loading state
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing matchmaking...</Text>
      </View>
    );
  }

  // Render match found
  if (currentMatch) {
    const matchedUser = currentMatch.matched_user_id === user?.id 
      ? { id: currentMatch.user_id } 
      : { id: currentMatch.matched_user_id };
      
    return (
      <View style={styles.container}>
        <Card style={styles.matchCard}>
          <Card.Content>
            <View style={styles.matchHeader}>
              <Title style={styles.matchTitle}>Match Found!</Title>
              <Text style={styles.matchSubtitle}>
                Compatibility: {Math.round((currentMatch.compatibility_score || 0.5) * 100)}%
              </Text>
            </View>
            
            <View style={styles.matchedUserContainer}>
              <Avatar.Image 
                size={100} 
                source={{ uri: matchedUser.avatar_url || 'https://ui-avatars.com/api/?name=User' }} 
              />
              <Title style={styles.matchedUserName}>{matchedUser.username || 'Player'}</Title>
              <Text style={styles.matchedUserBio}>{matchedUser.bio || 'No bio available'}</Text>
              
              <View style={styles.sportsContainer}>
                {(matchedUser.preferred_sports || []).map((sport: string) => (
                  <Chip 
                    key={sport} 
                    style={styles.sportChip}
                    icon={() => <MaterialCommunityIcons name={getSportIcon(sport)} size={16} color={COLORS.white} />}
                  >
                    {sport}
                  </Chip>
                ))}
              </View>
            </View>
            
            {currentMatch.message && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageLabel}>Message:</Text>
                <Text style={styles.messageText}>{currentMatch.message}</Text>
              </View>
            )}
            
            <View style={styles.matchActionButtons}>
              <Button 
                mode="contained" 
                style={[styles.actionButton, styles.rejectButton]} 
                onPress={() => rejectMatch(currentMatch.id)}
              >
                Decline
              </Button>
              <Button 
                mode="contained" 
                style={[styles.actionButton, styles.acceptButton]} 
                onPress={() => acceptMatch(currentMatch.id)}
              >
                Accept
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Render matchmaking interface
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Matchmaking Preferences</Title>
          
          <Text style={styles.sectionLabel}>Sports</Text>
          <View style={styles.multiSelectContainer}>
            <MultiSelect
              items={sportOptions}
              uniqueKey="id"
              onSelectedItemsChange={(selectedItems) => 
                setPreferences(prev => ({ ...prev, sports: selectedItems }))
              }
              selectedItems={preferences.sports}
              selectText="Select Sports"
              searchInputPlaceholderText="Search Sports..."
              tagRemoveIconColor={COLORS.error}
              tagBorderColor={COLORS.primary}
              tagTextColor={COLORS.primary}
              selectedItemTextColor={COLORS.primary}
              selectedItemIconColor={COLORS.primary}
              itemTextColor="#000"
              displayKey="name"
              searchInputStyle={{ color: '#000' }}
              styleMainWrapper={styles.multiSelectWrapper}
              styleDropdownMenuSubsection={styles.multiSelectDropdown}
              hideSubmitButton
            />
          </View>
          
          <Text style={styles.sectionLabel}>Skill Level</Text>
          <View style={styles.skillLevelContainer}>
            {skillLevelOptions.map(option => (
              <Chip
                key={option.id}
                selected={preferences.skillLevel === option.id}
                onPress={() => setPreferences(prev => ({ ...prev, skillLevel: option.id }))}
                style={[
                  styles.skillChip,
                  preferences.skillLevel === option.id && styles.selectedSkillChip
                ]}
                textStyle={preferences.skillLevel === option.id ? styles.selectedChipText : {}}
              >
                {option.name}
              </Chip>
            ))}
          </View>
          
          <Text style={styles.sectionLabel}>Maximum Distance: {preferences.maxDistance} km</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={preferences.maxDistance}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, maxDistance: value }))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#D0D0D0"
            thumbTintColor={COLORS.primary}
          />
          
          <View style={styles.lookingForContainer}>
            <Text style={styles.sectionLabel}>I'm looking for:</Text>
            <View style={styles.lookingForOptions}>
              <Chip
                selected={preferences.lookingForGame}
                onPress={() => setPreferences(prev => ({ ...prev, lookingForGame: true }))}
                style={[styles.lookingChip, preferences.lookingForGame && styles.selectedLookingChip]}
                textStyle={preferences.lookingForGame ? styles.selectedChipText : {}}
                icon="account-group"
              >
                A Game
              </Chip>
              <Chip
                selected={!preferences.lookingForGame}
                onPress={() => setPreferences(prev => ({ ...prev, lookingForGame: false }))}
                style={[styles.lookingChip, !preferences.lookingForGame && styles.selectedLookingChip]}
                textStyle={!preferences.lookingForGame ? styles.selectedChipText : {}}
                icon="account"
              >
                A Partner
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {isSearching ? (
        <View style={styles.searchingContainer}>
          <Text style={styles.searchingText}>Searching for players...</Text>
          <Text style={styles.searchTimeText}>Time elapsed: {formatSearchTime(searchTime)}</Text>
          
          <Animated.View 
            style={[
              styles.pulseCircle,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <MaterialCommunityIcons name="radar" size={120} color={COLORS.primary} />
          </Animated.View>
          
          {potentialMatches.length > 0 && (
            <View style={styles.potentialMatchesContainer}>
              <Text style={styles.potentialMatchesTitle}>
                {potentialMatches.length} potential {potentialMatches.length === 1 ? 'match' : 'matches'} found
              </Text>
              <ProgressBar 
                progress={Math.min(1, potentialMatches.length / 10)} 
                color={COLORS.primary} 
                style={styles.matchProgress} 
              />
            </View>
          )}
          
          <Button 
            mode="contained" 
            onPress={toggleMatchmaking} 
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      ) : (
        <Button 
          mode="contained" 
          onPress={toggleMatchmaking} 
          style={styles.startButton}
          icon="account-search"
        >
          Start Matchmaking
        </Button>
      )}
    </ScrollView>
  );
};

// Helper function to get sport icon
const getSportIcon = (sport: string) => {
  switch (sport) {
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
      return 'handball';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.small,
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  preferencesCard: {
    marginBottom: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    elevation: 4,
  },
  cardTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginBottom: SPACING.medium,
    color: COLORS.primary,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    marginTop: SPACING.medium,
    marginBottom: SPACING.small,
    color: COLORS.text,
  },
  multiSelectContainer: {
    marginBottom: SPACING.small,
  },
  multiSelectWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.small,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  multiSelectDropdown: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xsmall,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.small,
  },
  skillChip: {
    margin: SPACING.xsmall,
    backgroundColor: COLORS.white,
  },
  selectedSkillChip: {
    backgroundColor: COLORS.primary,
  },
  selectedChipText: {
    color: COLORS.white,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  lookingForContainer: {
    marginVertical: SPACING.small,
  },
  lookingForOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.small,
  },
  lookingChip: {
    paddingHorizontal: SPACING.medium,
    backgroundColor: COLORS.white,
  },
  selectedLookingChip: {
    backgroundColor: COLORS.primary,
  },
  startButton: {
    marginTop: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.primary,
  },
  searchingContainer: {
    alignItems: 'center',
    marginTop: SPACING.large,
    paddingVertical: SPACING.large,
  },
  searchingText: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.small,
  },
  searchTimeText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    marginBottom: SPACING.large,
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  potentialMatchesContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  potentialMatchesTitle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  matchProgress: {
    width: '80%',
    height: 8,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  matchCard: {
    margin: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    elevation: 4,
  },
  matchHeader: {
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  matchTitle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  matchSubtitle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  matchedUserContainer: {
    alignItems: 'center',
    marginVertical: SPACING.medium,
  },
  matchedUserName: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    marginTop: SPACING.small,
  },
  matchedUserBio: {
    fontSize: FONT_SIZES.medium,
    textAlign: 'center',
    marginVertical: SPACING.small,
    color: COLORS.text,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.small,
  },
  sportChip: {
    margin: SPACING.xsmall,
    backgroundColor: COLORS.primary,
  },
  messageContainer: {
    marginVertical: SPACING.medium,
    padding: SPACING.small,
    backgroundColor: COLORS.lightBackground,
    borderRadius: BORDER_RADIUS.small,
  },
  messageLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  messageText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    marginTop: SPACING.xsmall,
  },
  matchActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.medium,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xsmall,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
});

export default MatchmakingScreen;
