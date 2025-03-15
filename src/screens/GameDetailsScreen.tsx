import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Avatar, 
  Title, 
  Paragraph, 
  Divider, 
  List, 
  Chip, 
  Portal, 
  Dialog 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

// Game mock data
const mockGameDetails = {
  id: '123',
  title: 'Basketball 3v3 Tournament',
  host: {
    id: '456',
    name: 'Michael Jordan',
    profileImage: 'https://via.placeholder.com/60',
    gamesHosted: 23,
    rating: 4.8
  },
  dateTime: '2023-06-20T18:30:00',
  endTime: '2023-06-20T20:30:00',
  location: {
    name: 'Main Basketball Court',
    address: 'University Campus, Building 5',
    coordinates: {
      latitude: 37.78825,
      longitude: -122.4324
    }
  },
  sport: 'Basketball',
  skillLevel: 'intermediate',
  description: 'Looking for players for a friendly 3v3 basketball tournament. All skill levels welcome, but some experience is preferred. We\'ll form teams on the spot. Bring water and a good attitude!',
  rules: '3v3 half-court games. First team to 11 points wins (must win by 2). Winners stay on court.',
  requiredPlayers: 12,
  joinedPlayers: [
    { id: '1', name: 'LeBron James', profileImage: 'https://via.placeholder.com/50' },
    { id: '2', name: 'Stephen Curry', profileImage: 'https://via.placeholder.com/50' },
    { id: '3', name: 'Kobe Bryant', profileImage: 'https://via.placeholder.com/50' },
    { id: '4', name: 'Kevin Durant', profileImage: 'https://via.placeholder.com/50' },
    { id: '5', name: 'James Harden', profileImage: 'https://via.placeholder.com/50' }
  ],
  status: 'open', // 'open', 'full', 'in-progress', 'completed', 'cancelled'
  equipment: 'Basketballs provided, but feel free to bring your own.',
  fee: 'Free',
  weatherInfo: 'Game will be cancelled in case of rain.'
};

// Mock discussions
const mockDiscussions = [
  {
    id: '1',
    user: {
      id: '2',
      name: 'Stephen Curry',
      profileImage: 'https://via.placeholder.com/40'
    },
    message: 'Looking forward to it! Is parking available nearby?',
    timestamp: '2023-06-18T14:23:00'
  },
  {
    id: '2',
    user: {
      id: '456',
      name: 'Michael Jordan',
      profileImage: 'https://via.placeholder.com/40',
      isHost: true
    },
    message: 'Yes, there\'s a free parking lot right next to the court. See you all there!',
    timestamp: '2023-06-18T15:45:00'
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Kobe Bryant',
      profileImage: 'https://via.placeholder.com/40'
    },
    message: 'I might be 5 minutes late. Please don\'t start without me!',
    timestamp: '2023-06-19T09:12:00'
  }
];

// Define route params type
type GameDetailsParams = {
  gameId: string;
};

type GameDetailsRouteProps = RouteProp<{
  GameDetails: GameDetailsParams;
}, 'GameDetails'>;

const GameDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<GameDetailsRouteProps>();
  const [isJoining, setIsJoining] = useState(false);
  const [confirmJoinVisible, setConfirmJoinVisible] = useState(false);
  
  // Get game ID from params, or use mock if not available
  const gameId = route.params?.gameId || mockGameDetails.id;
  const game = mockGameDetails; // In a real app, you'd fetch the game based on gameId
  
  // Calculate remaining spots
  const remainingSpots = game.requiredPlayers - game.joinedPlayers.length;
  
  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Format relative time for discussion
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
  };
  
  // Handle join game
  const handleJoinGame = () => {
    setIsJoining(true);
    // Simulate API call
    setTimeout(() => {
      setIsJoining(false);
      // Here you would update the game status with the new player
      Alert.alert(
        "Success",
        "You've successfully joined the game!",
        [{ text: "Great!" }]
      );
      setConfirmJoinVisible(false);
    }, 1500);
  };
  
  // Handle navigation to host profile
  const navigateToHostProfile = () => {
    console.log(`Navigating to host profile: ${game.host.id}`);
    // In a real app, you'd navigate to the host's profile
    // navigation.navigate('Profile', { userId: game.host.id });
  };
  
  // Handle view location
  const viewLocationOnMap = () => {
    console.log(`Opening map with coordinates: ${game.location.coordinates.latitude}, ${game.location.coordinates.longitude}`);
    // In a real app, you'd open the map
  };
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Game Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{game.title}</Text>
          <View style={styles.sportBadge}>
            <Text style={styles.sportText}>{game.sport}</Text>
          </View>
        </View>
        
        {/* Host Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Hosted by</Title>
            <View style={styles.hostInfoContainer}>
              <Avatar.Image source={{ uri: game.host.profileImage }} size={50} />
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{game.host.name}</Text>
                <View style={styles.hostStats}>
                  <MaterialCommunityIcons name="trophy" size={16} color={COLORS.primary} />
                  <Text style={styles.hostStatText}>{game.host.gamesHosted} games hosted</Text>
                  <MaterialCommunityIcons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.hostStatText}>{game.host.rating}</Text>
                </View>
              </View>
              <Button 
                mode="outlined" 
                onPress={navigateToHostProfile}
                style={styles.viewProfileButton}
                labelStyle={styles.viewProfileButtonText}
              >
                Profile
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        {/* Date & Location */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formatDateTime(game.dateTime)}</Text>
                <Text style={styles.infoDuration}>
                  Duration: {new Date(game.endTime).getHours() - new Date(game.dateTime).getHours()} hours
                </Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{game.location.name}</Text>
                <Text style={styles.infoAddress}>{game.location.address}</Text>
                <Button 
                  mode="text" 
                  onPress={viewLocationOnMap}
                  style={styles.viewMapButton}
                  labelStyle={styles.viewMapButtonText}
                >
                  View on map
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Details</Title>
            <Paragraph style={styles.description}>{game.description}</Paragraph>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Players Needed</Text>
                <Text style={styles.detailValue}>{game.requiredPlayers}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="trophy-award" size={24} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Skill Level</Text>
                <Text style={styles.detailValue}>
                  {game.skillLevel.charAt(0).toUpperCase() + game.skillLevel.slice(1)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="cash" size={24} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Fee</Text>
                <Text style={styles.detailValue}>{game.fee}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Weather Policy</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{game.weatherInfo}</Text>
              </View>
            </View>
            
            {game.rules && (
              <>
                <Title style={styles.subSectionTitle}>Rules</Title>
                <Paragraph style={styles.description}>{game.rules}</Paragraph>
              </>
            )}
            
            {game.equipment && (
              <>
                <Title style={styles.subSectionTitle}>Equipment</Title>
                <Paragraph style={styles.description}>{game.equipment}</Paragraph>
              </>
            )}
          </Card.Content>
        </Card>
        
        {/* Participants */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.participantsHeader}>
              <Title style={styles.sectionTitle}>Participants</Title>
              <Chip mode="outlined" style={styles.spotsChip}>
                {remainingSpots} spots left
              </Chip>
            </View>
            
            <View style={styles.participantsList}>
              {game.joinedPlayers.map(player => (
                <View key={player.id} style={styles.participantItem}>
                  <Avatar.Image source={{ uri: player.profileImage }} size={40} />
                  <Text style={styles.participantName}>{player.name}</Text>
                  {player.id === game.host.id && (
                    <Chip compact style={styles.hostChip}>Host</Chip>
                  )}
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
        
        {/* Discussion */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Discussion</Title>
            {mockDiscussions.map(discussion => (
              <View key={discussion.id} style={styles.discussionItem}>
                <Avatar.Image source={{ uri: discussion.user.profileImage }} size={40} />
                <View style={styles.discussionContent}>
                  <View style={styles.discussionHeader}>
                    <Text style={styles.discussionUser}>
                      {discussion.user.name}
                      {discussion.user.isHost && ' (Host)'}
                    </Text>
                    <Text style={styles.discussionTime}>
                      {getRelativeTime(discussion.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.discussionMessage}>{discussion.message}</Text>
                </View>
              </View>
            ))}
            <Button 
              mode="text" 
              icon="message-text" 
              onPress={() => console.log('Message in discussion')}
              style={styles.addMessageButton}
            >
              Add message
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Join Button */}
      <View style={styles.bottomActions}>
        <Button 
          mode="contained" 
          onPress={() => setConfirmJoinVisible(true)}
          style={styles.joinButton}
          loading={isJoining}
          disabled={isJoining || remainingSpots === 0}
        >
          {remainingSpots > 0 ? 'Join Game' : 'Game Full'}
        </Button>
      </View>
      
      {/* Confirm Join Dialog */}
      <Portal>
        <Dialog visible={confirmJoinVisible} onDismiss={() => setConfirmJoinVisible(false)}>
          <Dialog.Title>Join this game?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              You are about to join "{game.title}". 
              Make sure you can attend at the scheduled time and location.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmJoinVisible(false)}>Cancel</Button>
            <Button onPress={handleJoinGame} loading={isJoining}>Join</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 80, // Space for bottom button
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.background,
    flex: 1,
  },
  sportBadge: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  sportText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  hostInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  hostName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  hostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  hostStatText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginRight: SPACING.md,
    marginLeft: SPACING.xs,
  },
  viewProfileButton: {
    borderColor: COLORS.primary,
  },
  viewProfileButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  infoContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  infoAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginTop: 2,
  },
  infoDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginTop: 2,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  viewMapButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingVertical: 0,
  },
  viewMapButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%', // Just under half to fit two in a row with spacing
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
    textAlign: 'center',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotsChip: {
    backgroundColor: COLORS.background,
  },
  participantsList: {
    marginTop: SPACING.md,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  participantName: {
    marginLeft: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  hostChip: {
    backgroundColor: COLORS.primary,
  },
  discussionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  discussionContent: {
    flex: 1,
    marginLeft: SPACING.md,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  discussionUser: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  discussionTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.disabled,
  },
  discussionMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  addMessageButton: {
    marginTop: SPACING.sm,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
  },
});

export default GameDetailsScreen; 