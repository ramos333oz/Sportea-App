import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Button, Card, Avatar, Chip, Dialog, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/constants/theme';
import { COLORS, SPACING, FONT_SIZES } from './src/constants/theme';

// Simplified App for Web Demo
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <DashboardDemo />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// Demo game data
const demoGames = [
  {
    id: '1',
    title: 'Basketball Game',
    date: 'Sun, Apr 27, 8:55 AM',
    location: 'Second Basketball Court',
    participants: 1,
    totalSpots: 5,
    sportType: 'basketball',
    isHosting: true,
  },
  {
    id: '2',
    title: 'Football Match',
    date: 'Mon, Apr 29, 4:30 PM',
    location: 'Central Park Field',
    participants: 8,
    totalSpots: 10,
    sportType: 'football',
    isHosting: false,
  },
  {
    id: '3',
    title: 'Badminton Session',
    date: 'Wed, May 1, 6:00 PM',
    location: 'Community Sports Hall',
    participants: 3,
    totalSpots: 4,
    sportType: 'badminton',
    isHosting: true,
  }
];

// Sport icon mapping
const getSportIcon = (sportType) => {
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

// Popular sports data
const popularSports = [
  { id: '1', name: 'Basketball' },
  { id: '2', name: 'Football' },
  { id: '3', name: 'Badminton' },
  { id: '4', name: 'Table Tennis' },
  { id: '5', name: 'Volleyball' }
];

// Dashboard Demo Component
function DashboardDemo() {
  const [games, setGames] = useState(demoGames);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isManaging, setIsManaging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleViewDetails = (game) => {
    setSelectedGame(game);
    setIsManaging(false);
    setShowDetails(true);
  };
  
  const handleManageGame = (game) => {
    setSelectedGame(game);
    setIsManaging(true);
    setShowDetails(true);
  };
  
  const handleDeleteGame = () => {
    setGames(games.filter(game => game.id !== selectedGame.id));
    setShowDeleteDialog(false);
    setShowDetails(false);
  };
  
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedGame(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.dateText}>Monday, April 28</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button 
            mode="contained" 
            icon="plus" 
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Host a Game
          </Button>
          
          <Button 
            mode="outlined" 
            icon="magnify" 
            style={[styles.actionButton, styles.secondaryButton]}
            contentStyle={styles.actionButtonContent}
          >
            Find Games
          </Button>
        </View>
        
        {/* Upcoming Games Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Upcoming Games</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          
          {games.map((game) => (
            <Card key={game.id} style={styles.gameCard}>
              <Card.Content>
                <View style={styles.gameCardHeader}>
                  <Avatar.Icon 
                    size={48} 
                    icon={getSportIcon(game.sportType)} 
                    style={styles.sportIcon} 
                  />
                  <View style={styles.gameCardTitleContainer}>
                    <Text style={styles.gameCardTitle}>{game.title}</Text>
                    <Text style={styles.gameCardDate}>{game.date}</Text>
                  </View>
                </View>
                
                <Text style={styles.gameCardLocation}>{game.location}</Text>
                <Text style={styles.gameCardParticipants}>
                  {game.participants}/{game.totalSpots} participants
                </Text>
              </Card.Content>
              
              <Card.Actions style={styles.gameCardActions}>
                <Button 
                  mode="outlined" 
                  style={styles.gameCardButton}
                  onPress={() => handleViewDetails(game)}
                >
                  Details
                </Button>
                
                {game.isHosting && (
                  <Button 
                    mode="contained" 
                    style={styles.gameCardButton}
                    onPress={() => handleManageGame(game)}
                  >
                    Manage
                  </Button>
                )}
              </Card.Actions>
            </Card>
          ))}
        </View>
        
        {/* Popular Sports Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Sports</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          
          <View style={styles.sportsGrid}>
            {popularSports.map((sport) => (
              <TouchableOpacity 
                key={sport.id}
                style={styles.sportItem}
              >
                <Avatar.Icon 
                  size={48} 
                  icon={getSportIcon(sport.name.toLowerCase())} 
                  style={styles.sportItemIcon} 
                />
                <Text style={styles.sportItemText}>{sport.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Game Details Dialog */}
      <Portal>
        <Dialog visible={showDetails} onDismiss={closeDetails} style={styles.dialog}>
          <Dialog.Title>{isManaging ? 'Manage Game' : 'Game Details'}</Dialog.Title>
          
          {selectedGame && (
            <Dialog.Content>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>{selectedGame.title}</Text>
                <Chip style={styles.chip}>{selectedGame.sportType}</Chip>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{selectedGame.date}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{selectedGame.location}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Participants:</Text>
                <Text style={styles.detailValue}>{selectedGame.participants}/{selectedGame.totalSpots}</Text>
              </View>
              
              {isManaging && (
                <View style={styles.managementSection}>
                  <Text style={styles.managementText}>
                    As the host of this game, you have the ability to manage it. You can view participants and delete the game if needed.
                  </Text>
                  
                  <Button 
                    mode="contained" 
                    style={styles.deleteButton}
                    buttonColor={COLORS.error}
                    onPress={() => setShowDeleteDialog(true)}
                  >
                    Delete Game
                  </Button>
                </View>
              )}
            </Dialog.Content>
          )}
          
          <Dialog.Actions>
            <Button onPress={closeDetails}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Game</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this game? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteGame} textColor={COLORS.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonContent: {
    height: 48,
  },
  secondaryButton: {
    borderColor: COLORS.primary,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#666',
  },
  gameCard: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportIcon: {
    backgroundColor: COLORS.primary,
  },
  gameCardTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  gameCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameCardDate: {
    fontSize: 14,
    color: '#666',
  },
  gameCardLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  gameCardParticipants: {
    fontSize: 14,
    color: '#666',
  },
  gameCardActions: {
    justifyContent: 'space-between',
  },
  gameCardButton: {
    flex: 1,
    margin: 4,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportItem: {
    width: '20%',
    marginBottom: 16,
    alignItems: 'center',
  },
  sportItemIcon: {
    backgroundColor: '#eee',
    marginBottom: 4,
  },
  sportItemText: {
    fontSize: 12,
    textAlign: 'center',
  },
  dialog: {
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
  },
  dialogHeader: {
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  managementSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  managementText: {
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 8,
  },
});