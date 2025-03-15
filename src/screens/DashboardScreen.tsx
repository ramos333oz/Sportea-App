import React from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/MainNavigator';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

// Mock data for upcoming games
const upcomingGames = [
  {
    id: '1',
    title: 'Basketball 3v3',
    date: 'Today, 4:00 PM',
    location: 'Main Basketball Court',
    participants: 4,
    totalSpots: 6,
    sportType: 'basketball',
  },
  {
    id: '2',
    title: 'Football Match',
    date: 'Tomorrow, 5:30 PM',
    location: 'University Field',
    participants: 18,
    totalSpots: 22,
    sportType: 'football',
  },
];

// Mock data for recommended games
const recommendedGames = [
  {
    id: '3',
    title: 'Badminton Doubles',
    date: 'Sat, 2:00 PM',
    location: 'Indoor Sports Hall',
    participants: 3,
    totalSpots: 4,
    sportType: 'badminton',
  },
  {
    id: '4',
    title: 'Table Tennis Tournament',
    date: 'Sun, 10:00 AM',
    location: 'Recreation Center',
    participants: 12,
    totalSpots: 16,
    sportType: 'table-tennis',
  },
];

// Sport icon mapping (you can replace with actual icons later)
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
    default:
      return 'sport';
  }
};

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const renderGameCard = (game: any) => (
    <Card style={styles.card} key={game.id}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Avatar.Icon 
            size={40} 
            icon={getSportIcon(game.sportType)} 
            style={{ backgroundColor: COLORS.primary }} 
          />
          <View style={styles.titleContainer}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardSubtitle}>{game.date}</Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.locationText}>{game.location}</Text>
          <View style={styles.participantsContainer}>
            <Text style={styles.participantsText}>
              {game.participants}/{game.totalSpots} participants
            </Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          style={styles.detailsButton}
          onPress={() => navigation.navigate('FindGames')}
        >
          Details
        </Button>
        <Button 
          mode="contained" 
          style={styles.joinButton}
          onPress={() => {/* Handle join action */}}
        >
          Join
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActionsContainer}>
        <Button 
          mode="contained" 
          icon="plus" 
          style={styles.hostButton}
          onPress={() => navigation.navigate('CreateGame')}
        >
          Host a Game
        </Button>
        <Button 
          mode="outlined" 
          icon="magnify" 
          style={styles.findButton}
          onPress={() => navigation.navigate('FindGames')}
        >
          Find Games
        </Button>
      </View>

      {/* Upcoming games section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Upcoming Games</Text>
          <Button 
            mode="text" 
            compact
            onPress={() => {/* View all upcoming games */}}
          >
            View All
          </Button>
        </View>
        {upcomingGames.length > 0 ? (
          upcomingGames.map(game => renderGameCard(game))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <Text style={styles.emptyText}>No upcoming games</Text>
              <Text style={styles.emptySubtext}>Join a game or host your own!</Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Recommended games section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          <Button 
            mode="text" 
            compact
            onPress={() => navigation.navigate('FindGames')}
          >
            View All
          </Button>
        </View>
        {recommendedGames.map(game => renderGameCard(game))}
      </View>

      {/* Popular sports section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Popular Sports</Text>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularSportsContent}
        >
          <Chip 
            style={styles.sportChip} 
            onPress={() => {/* Filter by basketball */}}
            icon="basketball"
          >
            Basketball
          </Chip>
          <Chip 
            style={styles.sportChip} 
            onPress={() => {/* Filter by football */}}
            icon="soccer"
          >
            Football
          </Chip>
          <Chip 
            style={styles.sportChip} 
            onPress={() => {/* Filter by badminton */}}
            icon="badminton"
          >
            Badminton
          </Chip>
          <Chip 
            style={styles.sportChip} 
            onPress={() => {/* Filter by table tennis */}}
            icon="table-tennis"
          >
            Table Tennis
          </Chip>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  welcomeSection: {
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
    marginTop: SPACING.xs,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  hostButton: {
    flex: 1,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.primary,
  },
  findButton: {
    flex: 1,
    marginLeft: SPACING.xs,
    borderColor: COLORS.primary,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
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
    color: COLORS.text,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  cardDetails: {
    marginBottom: SPACING.sm,
  },
  locationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  detailsButton: {
    marginRight: SPACING.md,
    borderColor: COLORS.primary,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
  },
  emptyCard: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.disabled,
    backgroundColor: COLORS.background,
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.disabled,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
    marginTop: SPACING.sm,
  },
  popularSportsContent: {
    paddingVertical: SPACING.md,
  },
  sportChip: {
    marginRight: SPACING.sm,
    backgroundColor: COLORS.card,
  },
});

export default DashboardScreen; 